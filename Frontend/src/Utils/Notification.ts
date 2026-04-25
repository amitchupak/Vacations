import { Notyf } from "notyf";
import { ErrorScope, mapErrorToUserMessage } from "./Errors";

// Shows toast pop-ups and turns ugly errors into friendly messages.
class Notification {

    // The toast library, configured to appear at the top center.
    private notyf = new Notyf({
        position: { x: "center", y: "top" },
        duration: 3000,
        dismissible: true,
        ripple: true,
    });

    // Show a green success toast.
    public success(message: string): void {
        this.notyf.success(message);
    }

    // Show a teal info toast.
    public info(message: string): void {
        this.notyf.success({ message, background: "#0e7490" });
    }

    // Show a red error toast with a safe, simple message.
    // The full error is logged to the console so developers can debug it.
    public error(rawError: unknown, scope: ErrorScope = "default"): void {
        console.error("[notification.error]", rawError);
        const message = mapErrorToUserMessage(rawError, scope);
        this.notyf.error(message);
    }
}

// One shared instance for the whole app.
export const notification = new Notification();
