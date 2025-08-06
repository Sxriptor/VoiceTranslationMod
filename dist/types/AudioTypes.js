"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingStep = exports.ProcessingStatus = void 0;
/**
 * Processing status enumeration
 */
var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["PENDING"] = "pending";
    ProcessingStatus["PROCESSING"] = "processing";
    ProcessingStatus["COMPLETED"] = "completed";
    ProcessingStatus["FAILED"] = "failed";
    ProcessingStatus["CANCELLED"] = "cancelled";
})(ProcessingStatus || (exports.ProcessingStatus = ProcessingStatus = {}));
/**
 * Processing pipeline steps
 */
var ProcessingStep;
(function (ProcessingStep) {
    ProcessingStep["AUDIO_CAPTURE"] = "audio_capture";
    ProcessingStep["SPEECH_TO_TEXT"] = "speech_to_text";
    ProcessingStep["TRANSLATION"] = "translation";
    ProcessingStep["TEXT_TO_SPEECH"] = "text_to_speech";
    ProcessingStep["AUDIO_OUTPUT"] = "audio_output";
})(ProcessingStep || (exports.ProcessingStep = ProcessingStep = {}));
//# sourceMappingURL=AudioTypes.js.map