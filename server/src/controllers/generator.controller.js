import asyncHandler from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";
import {
  getAvailableTechData,
  generateProjectArchive,
} from "../services/generator.service.js";

class GeneratorController {
  /**
   * Returns available technologies, implemented modules, and providers.
   */
  getTech = asyncHandler(async (req, res) => {
    const data = getAvailableTechData();

    return success(res, {
      message: "Available technologies retrieved successfully.",
      data,
    });
  });

  /**
   * Validates and generates a project as a downloadable ZIP archive.
   */
  generate = asyncHandler(async (req, res) => {
    const { projectName, serverDirectory, modules } = req.body ?? {};

    const result = await generateProjectArchive({
      projectName,
      serverDirectory,
      modules,
    });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": result.zipBuffer.length,
      "X-Project-Name": result.projectName,
      "X-Server-Directory": result.serverDirectory,
      "X-Selected-Modules": JSON.stringify(result.selectedModules),
      "X-Integrated-Files": JSON.stringify(result.integratedFiles),
      "X-Copied-Modules": JSON.stringify(result.copiedModules),
      "X-Next-Steps": JSON.stringify(result.nextSteps),
      "Access-Control-Expose-Headers":
        "Content-Disposition, X-Project-Name, X-Server-Directory, X-Selected-Modules, X-Integrated-Files, X-Copied-Modules, X-Next-Steps",
    });

    return res.end(result.zipBuffer);
  });
}

export default new GeneratorController();
