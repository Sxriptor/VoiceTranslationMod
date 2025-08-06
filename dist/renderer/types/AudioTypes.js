/**
 * Processing status enumeration
 */
export var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["PENDING"] = "pending";
    ProcessingStatus["PROCESSING"] = "processing";
    ProcessingStatus["COMPLETED"] = "completed";
    ProcessingStatus["FAILED"] = "failed";
    ProcessingStatus["CANCELLED"] = "cancelled";
})(ProcessingStatus || (ProcessingStatus = {}));
/**
 * Processing pipeline steps
 */
export var ProcessingStep;
(function (ProcessingStep) {
    ProcessingStep["AUDIO_CAPTURE"] = "audio_capture";
    ProcessingStep["SPEECH_TO_TEXT"] = "speech_to_text";
    ProcessingStep["TRANSLATION"] = "translation";
    ProcessingStep["TEXT_TO_SPEECH"] = "text_to_speech";
    ProcessingStep["AUDIO_OUTPUT"] = "audio_output";
})(ProcessingStep || (ProcessingStep = {}));
//# sourceMappingURL=AudioTypes.js.map