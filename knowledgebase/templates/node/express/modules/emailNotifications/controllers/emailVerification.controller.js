import verificationService from "../services/emailVerification.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";

class VerificationController {
  send = asyncHandler(async (req, res) => {
    await verificationService.send(req.user.sub);

    return success(res, {
      message: "Verification email sent successfully.",
    });
  });

  verify = asyncHandler(async (req, res) => {
    await verificationService.verifyEmail(req.query.token);

    return success(res, {
      message: "Email verified successfully.",
    });
  });
}

export default new VerificationController();
