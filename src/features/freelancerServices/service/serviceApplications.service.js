import { FreelancerServiceApplicationModel } from "../model/freelancerServiceApplication.model.js";
import { FreeLancerServiceModel } from "../model/freelancerService.model.js";
import mongoose from "mongoose";
import transactionService from "../../transaction/service/transaction.service.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import WalletModel from "../../wallet/model/wallet.model.js";
import FreelancerModel from "../../freelancer/model/freelancer.model.js";
import AdminWalletModel from "../../wallet/model/adminWallet.model.js";

class ServiceApplicationsService {

  // Create new service application
  async create(applicationData) {
    try {
      const service = await FreeLancerServiceModel.findById(applicationData.service);
      if (!service) {
        throw new AppError("Service not found", httpCode.NOT_FOUND);
      }
      if (service.status !== 'active') {
        throw new AppError("Service is not available for booking", httpCode.BAD_REQUEST);
      }
      const existingApplication = await FreelancerServiceApplicationModel.findOne({
        service: applicationData.service,
        client: applicationData.client,
        status: { $in: ['accepted', 'hired'] }
      });
      if (existingApplication) {
        throw new AppError("You already have an active application for this service", httpCode.BAD_REQUEST);
      }
      if (applicationData.paymentType == 'advance' && applicationData.bookingAmount < (0.3 * service.price)) {
        throw new AppError("Advance payment must be at least 30% of the service price", httpCode.BAD_REQUEST);
      }
      if (applicationData.bookingAmount > service.price) {
        throw new AppError("Booking amount cannot exceed the service price", httpCode.BAD_REQUEST);
      }
      if (applicationData.paymentType == 'full') {
        applicationData.pendingAmount = 0;
      } else if (applicationData.paymentType == 'advance') {
        applicationData.pendingAmount = service.price - applicationData.bookingAmount;
      } else {
        applicationData.pendingAmount = service.price;
      }

      const application = new FreelancerServiceApplicationModel(applicationData);
      const transactionData = {
        amount: applicationData.bookingAmount,
        user: applicationData.client,
        freelancer: service.freelancer,
        txnType: 'credit',
      };
      const transaction = await transactionService.createTransaction(transactionData);
      const savedApplication = await application.save();
      return {
        'applicationId': savedApplication._id,
        'transactionId': transaction.tnxId,
      };
    } catch (error) {
      throw error;
    }
  }
  // Get application by ID with full population
  async getById(applicationId) {
    try {
      const application = await FreelancerServiceApplicationModel.findById(applicationId)
        .populate({
          path: 'service',
          populate: {
            path: 'freelancer',
            select: 'name phone email profession skills city state image'
          }
        })
        .populate({
          path: 'service',
          populate: {
            path: 'category',
            select: 'name'
          }
        })
        .populate('client', 'name phone email image');

      return application;
    } catch (error) {
      throw error;
    }
  }

  // Get applications by freelancer (for services owned by the freelancer)
  async getByFreelancer(freelancerId, status = null, page = 1, limit = 10) {
    try {

      const services = await FreeLancerServiceModel.find({ freelancer: freelancerId }).select('_id');
      const serviceIds = services.map(service => service._id);

      const query = { service: { $in: serviceIds } };
      if (status && status !== 'all') {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const applications = await FreelancerServiceApplicationModel.find(query)
        .populate({
          path: 'service',
          select: 'title price duration category location',
          populate: {
            path: 'category',
            select: 'name'
          }
        })
        .populate('client', 'name phone email image city state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await FreelancerServiceApplicationModel.countDocuments(query);

      return {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching freelancer applications: ${error.message}`);
    }
  }

  // Get applications by client
  async getByClient(clientId, status = null, page = 1, limit = 10) {
    try {
      const query = { client: clientId };
      if (status && status !== 'all') {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const applications = await FreelancerServiceApplicationModel.find(query)
        .populate({
          path: 'service',
          select: 'title price duration category location freelancer',
          populate: [
            {
              path: 'category',
              select: 'name'
            },
            {
              path: 'freelancer',
              select: 'name phone email profession image city state'
            }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await FreelancerServiceApplicationModel.countDocuments(query);

      return {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching client applications: ${error.message}`);
    }
  }


  async updateStatus(applicationId, status, freelancerId, notes = '') {
    try {
      const application = await this.getById(applicationId);

      if (!application) {
        return { success: false, message: "Application not found" };
      }

      // Check if the freelancer owns this service
      if (application.service.freelancer._id.toString() !== freelancerId) {
        return { success: false, message: "You can only update applications for your own services" };
      }

      // Validate status transitions
      const validTransitions = {
        'pending': ['accepted', 'rejected'],
        'accepted': ['hired', 'rejected'],
        'hired': ['completed', 'rejected'],
        'completed': [],
        'rejected': [],
        'withdrawn': []
      };

      if (!validTransitions[application.status].includes(status)) {
        return {
          success: false,
          message: `Cannot transition from ${application.status} to ${status}`
        };
      }

      // Prepare update data with timestamp tracking
      const updateData = {
        status,
        freelancerNotes: notes,
        updatedAt: new Date()
      };

      // Add timestamp based on status
      switch (status) {
        case 'accepted':
          updateData.acceptedAt = new Date();
          break;
        case 'hired':
          updateData.hiredAt = new Date();
          break;
        case 'rejected':
          updateData.rejectedAt = new Date();
          break;
      }

      const updatedApplication = await FreelancerServiceApplicationModel.findByIdAndUpdate(
        applicationId,
        updateData,
        { new: true }
      );

      return {
        success: true,
        data: await this.getById(updatedApplication._id)
      };
    } catch (error) {
      throw new Error(`Error updating application status: ${error.message}`);
    }
  }
  async updatePaymentStatus(applicationId, clientId, status, tnxId) {
    try {
      const application = await this.getById(applicationId);
      if (!application) {
        throw new AppError("Application not found", httpCode.NOT_FOUND);
      }

      // Check if the client owns this application
      if (application.client._id.toString() !== clientId) {
        throw new AppError("You can only update applications for your own applications", httpCode.NOT_FOUND);
      }
      let transaction = await transactionService.getByTnxId(tnxId);
      if (!transaction || transaction.status !== "pending") {
        throw new AppError("Transaction not found", httpCode.NOT_FOUND);
      }
      transaction = await transactionService.updateStatusByTnxId(tnxId, status);
      //update wallet
      if (status === "completed") {
        // Logic to update freelancer wallet
        const freelancer = await FreelancerModel.findById(transaction.freelancer);
        console.log(freelancer);
        
        await WalletModel.findByIdAndUpdate(freelancer.wallet, {
          $inc: { balance: transaction.amount },
          $push: { transactions: transaction._id }
        })
     
        // Logic to update admin wallet

        const adminWallet = await AdminWalletModel.findOne();
        console.log(adminWallet);
        
        await AdminWalletModel.findByIdAndUpdate(adminWallet._id, {
          $inc: { currentBalance: transaction.amount + transaction.platformFee, totalEarnings: transaction.amount + transaction.platformFee },
          $push: { transactions: transaction._id }
        });
      }
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  // Withdraw application (only by client)
  async withdraw(applicationId, clientId) {
    try {
      const application = await FreelancerServiceApplicationModel.findById(applicationId);

      if (!application) {
        return { success: false, message: "Application not found" };
      }

      if (application.client.toString() !== clientId) {
        return { success: false, message: "You can only withdraw your own applications" };
      }

      if (!['pending', 'accepted'].includes(application.status)) {
        return { success: false, message: "Cannot withdraw application in current status" };
      }

      const updatedApplication = await FreelancerServiceApplicationModel.findByIdAndUpdate(
        applicationId,
        {
          status: 'withdrawn',
          updatedAt: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        data: await this.getById(updatedApplication._id)
      };
    } catch (error) {
      throw new Error(`Error withdrawing application: ${error.message}`);
    }
  }

  // Complete service (mark as completed by freelancer)
  async completeService(applicationId, freelancerId, completionNotes = '') {
    try {
      const application = await this.getById(applicationId);

      if (!application) {
        return { success: false, message: "Application not found" };
      }

      if (application.service.freelancer._id.toString() !== freelancerId) {
        return { success: false, message: "You can only complete applications for your own services" };
      }

      if (application.status !== 'hired') {
        return { success: false, message: "Can only complete hired services" };
      }

      const updatedApplication = await FreelancerServiceApplicationModel.findByIdAndUpdate(
        applicationId,
        {
          status: 'completed',
          completionNotes,
          completedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        data: await this.getById(updatedApplication._id)
      };
    } catch (error) {
      throw new Error(`Error completing service: ${error.message}`);
    }
  }

  // Get freelancer statistics
  async getFreelancerStats(freelancerId) {
    try {
      const services = await FreeLancerServiceModel.find({ freelancer: freelancerId }).select('_id');
      const serviceIds = services.map(service => service._id);

      const stats = await FreelancerServiceApplicationModel.aggregate([
        { $match: { service: { $in: serviceIds } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$bookingAmount' }
          }
        }
      ]);

      const totalApplications = await FreelancerServiceApplicationModel.countDocuments({
        service: { $in: serviceIds }
      });

      const result = {
        totalApplications,
        pending: 0,
        accepted: 0,
        rejected: 0,
        hired: 0,
        completed: 0,
        withdrawn: 0,
        totalEarnings: 0,
        completedEarnings: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        if (stat._id === 'completed') {
          result.completedEarnings = stat.totalAmount;
        }
        result.totalEarnings += stat.totalAmount;
      });

      // Calculate conversion rates
      result.acceptanceRate = totalApplications > 0 ?
        ((result.accepted + result.hired + result.completed) / totalApplications * 100).toFixed(2) : 0;
      result.completionRate = result.hired > 0 ?
        (result.completed / (result.hired + result.completed) * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      throw new Error(`Error fetching freelancer stats: ${error.message}`);
    }
  }

  // Get client statistics
  async getClientStats(clientId) {
    try {
      const stats = await FreelancerServiceApplicationModel.aggregate([
        { $match: { client: new mongoose.Types.ObjectId(clientId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalSpent: { $sum: '$bookingAmount' }
          }
        }
      ]);

      const totalApplications = await FreelancerServiceApplicationModel.countDocuments({
        client: clientId
      });

      const result = {
        totalApplications,
        pending: 0,
        accepted: 0,
        rejected: 0,
        hired: 0,
        completed: 0,
        withdrawn: 0,
        totalSpent: 0,
        completedSpent: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        if (stat._id === 'completed') {
          result.completedSpent = stat.totalSpent;
        }
        result.totalSpent += stat.totalSpent;
      });

      // Calculate success rate
      result.successRate = totalApplications > 0 ?
        ((result.hired + result.completed) / totalApplications * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      throw new Error(`Error fetching client stats: ${error.message}`);
    }
  }

  // Get all applications (Admin only)
  async getAll(status = null, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') {
    try {
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const applications = await FreelancerServiceApplicationModel.find(query)
        .populate({
          path: 'service',
          populate: {
            path: 'freelancer',
            select: 'name phone email'
          }
        })
        .populate('client', 'name phone email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const total = await FreelancerServiceApplicationModel.countDocuments(query);

      return {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching all applications: ${error.message}`);
    }
  }

  // Get analytics (Admin only)
  async getAnalytics(startDate, endDate) {
    try {
      const matchStage = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const analytics = await FreelancerServiceApplicationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$bookingAmount' },
            avgAmount: { $avg: '$bookingAmount' }
          }
        }
      ]);

      const totalApplications = await FreelancerServiceApplicationModel.countDocuments(matchStage);

      // Get monthly trends
      const monthlyTrends = await FreelancerServiceApplicationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            amount: { $sum: '$bookingAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return {
        totalApplications,
        statusBreakdown: analytics,
        monthlyTrends,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Error fetching analytics: ${error.message}`);
    }
  }
}

const serviceApplications = new ServiceApplicationsService();
export default serviceApplications;
