import WithdrawalService from "../service/withdrawal.service.js";
import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import AppError from "../../../utils/error.js";

// Create withdrawal request (for freelancers)
export const createWithdrawalRequest = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;
    const freelancerId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      throw new AppError("Amount must be greater than 0", httpCode.BAD_REQUEST);
    }

    if (!paymentMethod || !["bank_transfer", "upi", "paypal", "other"].includes(paymentMethod)) {
      throw new AppError("Invalid payment method", httpCode.BAD_REQUEST);
    }

    const withdrawalRequest = await WithdrawalService.createWithdrawalRequest(freelancerId, {
      amount,
      paymentMethod,
      paymentDetails,
    });

    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Withdrawal request created successfully", withdrawalRequest));
  } catch (error) {
    next(error);
  }
};

// Get withdrawal requests for freelancer
export const getMyWithdrawalRequests = async (req, res, next) => {
  try {
    const freelancerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const filters = { freelancer: freelancerId };
    if (status) {
      filters.status = status;
    }

    const result = await WithdrawalService.getWithdrawalRequests(filters, { page, limit });

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Withdrawal requests retrieved successfully", result));
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

    const responseData = {
      ...result,
      stats,
    };

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Withdrawal requests retrieved successfully", responseData));
  } catch (error) {
    next(error);
  }
};

// Approve withdrawal request (for admin)
export const approveWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { adminNotes, paymentReferenceId } = req.body;
    const adminId = req.user.id;

    const result = await WithdrawalService.approveWithdrawalRequest(requestId, adminId, {
      adminNotes,
      paymentReferenceId,
    });

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Withdrawal request approved and processed successfully", result));
  } catch (error) {
    next(error);
  }
};

// Reject withdrawal request (for admin)
export const rejectWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.user.id;

    const withdrawalRequest = await WithdrawalService.rejectWithdrawalRequest(requestId, adminId, {
      rejectionReason,
      adminNotes,
    });

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Withdrawal request rejected successfully", withdrawalRequest));
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

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Withdrawal request retrieved successfully", withdrawalRequest));
  } catch (error) {
    next(error);
  }
};

// Cancel withdrawal request (for freelancers - only pending requests)
export const cancelWithdrawalRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const freelancerId = req.user.id;

    const withdrawalRequest = await WithdrawalService.cancelWithdrawalRequest(requestId, freelancerId);

    return res
      .status(httpCode.OK)
      .json(formattedResponse("Withdrawal request cancelled successfully", withdrawalRequest));
  } catch (error) {
    next(error);
  }
};
