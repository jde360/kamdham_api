import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";
import WithdrawalService from "../service/withdrawal.service.js";

// Create withdrawal request (for freelancers)
export const createWithdrawalRequest = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const freelancerId = req.user.userId;

    // Validation
    if (!amount || amount <= 0) {
      throw new AppError("Invalid amount", httpCode.BAD_REQUEST);
    }

    if (!paymentMethod || !["bank_transfer", "upi", "paypal", "other"].includes(paymentMethod)) {
      throw new AppError("Invalid payment method", httpCode.BAD_REQUEST);
    }

    const withdrawalRequest = await WithdrawalService.createWithdrawalRequest(freelancerId, {
      amount,
      paymentMethod,
      paymentDetails,
    });
    res.status(201).json({
      success: true,
      message: "Withdrawal request created successfully",
      data: withdrawalRequest,
    });
  } catch (error) {
    next(error);


  }
};

// Get withdrawal requests for freelancer
export const getMyWithdrawalRequests = async (req, res, next) => {
  try {
    const freelancerId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filters = { freelancer: freelancerId };
    if (status) {
      filters.status = status;
    }
console.log(filters);

    const result = await WithdrawalService.getWithdrawalRequests(filters, { page, limit });

    res.status(200).json({
      success: true,
      message: "Withdrawal requests retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);

  }
};

// Get all withdrawal requests (for admin)
export const getAllWithdrawalRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, freelancer } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (freelancer) filters.freelancer = freelancer;

    const result = await WithdrawalService.getWithdrawalRequests(filters, { page, limit });
    const stats = await WithdrawalService.getWithdrawalStats(filters);

    res.status(200).json({
      success: true,
      message: "Withdrawal requests retrieved successfully",
      data: {
        ...result,
        stats,
      },
    });
  } catch (error) {
    next(error);

  }
};

// Approve withdrawal request (for admin)
export const approveWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { adminNotes, paymentReferenceId } = req.body;
    const adminId = req.user.userId;

    const result = await WithdrawalService.approveWithdrawalRequest(requestId, adminId, {
      adminNotes,
      paymentReferenceId,
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request approved and processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);

  }
};

// Reject withdrawal request (for admin)
export const rejectWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.user.userId;

    const withdrawalRequest = await WithdrawalService.rejectWithdrawalRequest(requestId, adminId, {
      rejectionReason,
      adminNotes,
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request rejected successfully",
      data: withdrawalRequest,
    });
  } catch (error) {
    next(error);

  }
};

// Get single withdrawal request details
export const getWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const withdrawalRequest = await WithdrawalService.getWithdrawalRequestById(
      requestId,
      userRole,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Withdrawal request retrieved successfully",
      data: withdrawalRequest,
    });
  } catch (error) {
    next(error);
    ;
  }
};

// Cancel withdrawal request (for freelancers - only pending requests)
export const cancelWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const freelancerId = req.user.userId;

    const withdrawalRequest = await WithdrawalService.cancelWithdrawalRequest(requestId, freelancerId);

    res.status(200).json({
      success: true,
      message: "Withdrawal request cancelled successfully",
      data: withdrawalRequest,
    });
  } catch (error) {
    next(error);

  }
};
