import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import bannerService from "../service/banner.service.js";

/**
 * Create a new banner (Admin only)
 */
export const createBanner = async (req, res, next) => {
  try {
    const adminId = req.user?._id; // Assuming admin info is in req.user from auth middleware
    const banner = await bannerService.create(req.body, adminId);
    return res
      .status(httpCode.CREATED)
      .json(formattedResponse("Banner created successfully", banner));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all banners with filtering and pagination (Admin only)
 */
export const getAllBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getAll(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banners fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get banner by ID (Admin only)
 */
export const getBannerById = async (req, res, next) => {
  try {
    const banner = await bannerService.getById(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner fetched successfully", banner));
  } catch (error) {
    next(error);
  }
};

/**
 * Update banner (Admin only)
 */
export const updateBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.update(req.params.id, req.body);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner updated successfully", banner));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete banner (Admin only)
 */
export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.delete(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner deleted successfully", banner));
  } catch (error) {
    next(error);
  }
};

/**
 * Get active banners by position (Public endpoint)
 */
export const getActiveBannersByPosition = async (req, res, next) => {
  try {
    const { position } = req.params;
    const { targetAudience = "all" } = req.query;
    
    const banners = await bannerService.getActiveByPosition(position, targetAudience);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Active banners fetched successfully", banners));
  } catch (error) {
    next(error);
  }
};

/**
 * Get banners for multiple positions (Public endpoint)
 */
export const getBannersByPositions = async (req, res, next) => {
  try {
    const { positions } = req.body; // Array of positions
    const { targetAudience = "all" } = req.query;

    if (!Array.isArray(positions) || positions.length === 0) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Positions array is required", null));
    }

    const banners = await bannerService.getBannersByPositions(positions, targetAudience);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banners fetched successfully", banners));
  } catch (error) {
    next(error);
  }
};

/**
 * Track banner click (Public endpoint)
 */
export const trackBannerClick = async (req, res, next) => {
  try {
    const { id } = req.params;
    await bannerService.trackClick(id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner click tracked successfully", null));
  } catch (error) {
    next(error);
  }
};

/**
 * Get banner analytics (Admin only)
 */
export const getBannerAnalytics = async (req, res, next) => {
  try {
    const analytics = await bannerService.getAnalytics(req.query);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner analytics fetched successfully", analytics));
  } catch (error) {
    next(error);
  }
};

/**
 * Get banner performance metrics (Admin only)
 */
export const getBannerPerformance = async (req, res, next) => {
  try {
    const performance = await bannerService.getPerformanceMetrics(req.params.id);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner performance fetched successfully", performance));
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update banner status (Admin only)
 */
export const bulkUpdateBannerStatus = async (req, res, next) => {
  try {
    const { bannerIds, status } = req.body;

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Banner IDs array is required", null));
    }

    if (!status) {
      return res
        .status(httpCode.BAD_REQUEST)
        .json(formattedResponse("Status is required", null));
    }

    const result = await bannerService.bulkUpdateStatus(bannerIds, status);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Banner status updated successfully", result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active banners (Public endpoint) - for app home page, etc.
 */
export const getAllActiveBanners = async (req, res, next) => {
  try {
    const { targetAudience = "all" } = req.query;
    
    const filters = {
      status: "active",
      isVisible: true,
      targetAudience,
    };

    const result = await bannerService.getAll(filters);
    return res
      .status(httpCode.OK)
      .json(formattedResponse("Active banners fetched successfully", result));
  } catch (error) {
    next(error);
  }
};
