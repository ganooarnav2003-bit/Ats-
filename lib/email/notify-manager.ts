import { Resend } from "resend";

export type NotifyPayload = {
  managerEmail: string;
  managerName: string;
  employeeName: string;
  cycleName: string;
  reviewUrl: string;
};

export type NotifyResult = {
  sent: boolean;
  skipped?: boolean;
  error?: string;
};

/**
 * Transactional email is a side effect. Callers must not fail the parent
 * write if this returns { sent: false }.
 */
export async function notifyManagerOfAppraisal(
  payload: NotifyPayload,
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[notify-manager] RESEND_API_KEY missing; skipping send", {
      to: payload.managerEmail,
    });
    return { sent: false, skipped: true, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM_EMAIL ?? "Apex Performance <pms@helio.example>";
    const { error } = await resend.emails.send({
      from,
      to: payload.managerEmail,
      subject: `${payload.employeeName} submitted a self-appraisal (${payload.cycleName})`,
      html: `
        <p>Hi ${payload.managerName},</p>
        <p><strong>${payload.employeeName}</strong> submitted their self-appraisal for <strong>${payload.cycleName}</strong>.</p>
        <p><a href="${payload.reviewUrl}">Open the split-view review</a></p>
        <p>— Apex Performance</p>
      `,
    });
    if (error) {
      console.error("[notify-manager] Resend API error", error);
      return { sent: false, error: "Resend API error" };
    }
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("[notify-manager] send failed", message);
    return { sent: false, error: message };
  }
}
