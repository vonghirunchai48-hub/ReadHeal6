import React, { useState } from 'react';
import { NotificationItem } from '../types';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Mail, 
  CalendarCheck, 
  AlertTriangle, 
  Award, 
  MessageSquare, 
  VolumeX,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { healingSound } from '../utils/audioSynthesizer';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onNavigateTab?: (tab: 'home' | 'volunteer-register' | 'volunteer-audio' | 'booking' | 'admin' | 'my-bookings') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'email'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'email') return n.emailSent;
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'match':
        return <CalendarCheck className="w-5 h-5 text-emerald-600" />;
      case 'cancellation':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'certificate':
        return <Award className="w-5 h-5 text-sky-600" />;
      case 'review':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'report':
        return <VolumeX className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ศูนย์แจ้งเตือนและระบบอีเมล</h2>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `มีการแจ้งเตือนใหม่ ${unreadCount} รายการ` : 'อ่านครบทั้งหมดแล้ว'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Mark all read */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ยังไม่ได้อ่าน ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                filter === 'email'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>ส่งอีเมลแล้ว</span>
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => {
                healingSound.playClickBeep();
                onMarkAllAsRead();
              }}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>อ่านทั้งหมด</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 my-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">ไม่มีรายการแจ้งเตือนในหมวดนี้</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkAsRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                    : 'bg-sky-50/60 border-sky-200 hover:bg-sky-50 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-100 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                      <span>{item.createdAt}</span>

                      <div className="flex items-center gap-2">
                        {item.emailSent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            <Mail className="w-3 h-3" />
                            <span>ส่งอีเมลแล้ว</span>
                          </span>
                        )}

                        {item.actionUrlTab && onNavigateTab && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onNavigateTab(item.actionUrlTab!);
                            }}
                            className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-0.5"
                          >
                            <span>เปิดดู</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>ระบบเชื่อมต่ออีเมลแจ้งเตือนอัตโนมัติ (Mock SMTP Engine)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
