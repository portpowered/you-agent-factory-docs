import { getNoticeClassName } from "@/components/ui/factory-theme";
import { Icon, type IconName } from "@/components/ui/icon";
import type { ReactNode } from "react";

type NoticeTone = "danger" | "info" | "success" | "warning";

const NOTICE_ICON_BY_TONE: Record<NoticeTone, IconName> = {
  danger: "warningTriangle",
  info: "info",
  success: "checkCircle",
  warning: "warningTriangle",
};

type NoticeFrameProps = {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  role: "alert" | "status";
  title: string;
  tone: NoticeTone;
};

function NoticeFrame({
  action,
  children,
  className,
  role,
  title,
  tone,
}: NoticeFrameProps) {
  return (
    <div className={getNoticeClassName({ className, tone })} role={role}>
      <div aria-hidden="true" className="ui-notice__icon-wrap">
        <Icon className="ui-notice__icon" name={NOTICE_ICON_BY_TONE[tone]} />
      </div>
      <div className="ui-notice__body">
        <p className="ui-notice__title">{title}</p>
        {children ? <div className="ui-notice__content">{children}</div> : null}
      </div>
      {action ? <div className="ui-notice__action">{action}</div> : null}
    </div>
  );
}

type BannerProps = Omit<NoticeFrameProps, "role">;

export function Banner(props: BannerProps) {
  return <NoticeFrame role="status" {...props} />;
}

type AlertProps = Omit<NoticeFrameProps, "role">;

export function Alert(props: AlertProps) {
  return <NoticeFrame role="alert" {...props} />;
}
