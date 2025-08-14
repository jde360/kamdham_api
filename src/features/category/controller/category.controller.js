import { formattedResponse } from "../../../utils/formatedRes.js";
import { httpCode } from "../../../utils/httpCode.js";
import categoryService from "../service/category.service.js";

export const createCategory = async (req, res, next) => {
    try {

        let data = req.body;
        if (req.user.userType == 'freelancer') {
            data.requestedBy = req.user._id;
        } else {
            data.requestedBy = null;
        }
        const result = await categoryService.cretateCategory(data);
        return res.status(httpCode.CREATED).json(formattedResponse("Category created successfully", result));
    } catch (error) {
        next(error);
    }
}
export const getAllCategories = async (req, res, next) => {
    try {
        const { status, requestedBy } = req.query;


        const result = await categoryService.getAll(req.query);
        return res.status(httpCode.OK).json(formattedResponse("Categories fetched successfully", result));
    } catch (error) {
        next(error);
    }
}
