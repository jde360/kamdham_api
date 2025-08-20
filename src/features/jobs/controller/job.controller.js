import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import jobService from "../service/job.service.js";

export const createJob = async (req, res, next) => {
  try {
    req.body.postedBy = req.user.userId;
    const result = await jobService.create(req.body);
    res.status(httpCode.CREATED).json(formattedResponse("Job created", result));
  } catch (error) {
    next(error);
  }
};

export const getAllJobs = async (req, res, next) => {
  try {
    const result = await jobService.getAllJobs();
    res.status(httpCode.OK).json(formattedResponse("Jobs fetched", result));
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const result = await jobService.getJobById(req.params.id);
    res.status(httpCode.OK).json(formattedResponse("Job fetched", result));
  } catch (error) {
    next(error);
  }
};

export const getJobsByUser = async (req, res, next) => {
  try {
    console.log("Fetching jobs by user:", req.params.userId);
    const result = await jobService.getJobsByUser(req.params.userId);
    res.status(httpCode.OK).json(formattedResponse("Jobs fetched", result));
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const result = await jobService.updateJobById(req.params.id, req.body);
    res.status(httpCode.OK).json(formattedResponse("Job updated", result));
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const result = await jobService.deleteJobById(req.params.id);
    res.status(httpCode.OK).json(formattedResponse("Job deleted", result));
  } catch (error) {
    next(error);
  }
};
export const getJobsByCity = async (req, res, next) => {
  try {
    const result = await jobService.getJobsByCity(req.params.city);
    res.status(httpCode.OK).json(formattedResponse("Jobs fetched", result));
  } catch (error) {
    next(error);
  }
};

export const getJobsByState = async (req, res, next) => {
  try {
    console.log("Fetching jobs by state:", req.params.state);
    const result = await jobService.getJobsByState(req.params.state);
    res.status(httpCode.OK).json(formattedResponse("Jobs fetched", result));
  } catch (error) {
    next(error);
  }
};

export const getByCategory = async (req, res, next) => {
  try {
    const result = await jobService.getByCategory(req.params.cid);
    res.status(httpCode.OK).json(formattedResponse("Jobs fetched", result));
  } catch (error) {
    next(error);
  }
};

export const searchJobs = async (req, res, next) => {
  try {
    console.log("Fetching jobs by state:", req.query);
    const result = await jobService.searchJobs(req.query);
    res.status(httpCode.OK).json(formattedResponse("Jobs fetched", result));
  } catch (error) {
    next(error);
  }
};
