export const formattedResponse = ( message, data) => {
    return {
        status: "success",
        message: message || "Operation successful",
        data: data || null,
    };
}