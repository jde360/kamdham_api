export const getPlatformFee = (purchasingAmt)=>{
    console.log("purchasingAmt",purchasingAmt);
    
    if (purchasingAmt <= 5000) {
        return 100; 
    } else if (purchasingAmt <= 20000) {
        return purchasingAmt * 0.02; 
    } else {
        return purchasingAmt * 0.01; 
    }
}