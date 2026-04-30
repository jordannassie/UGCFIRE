'use client'

import { Phone, MessageSquare, CalendarCheck } from 'lucide-react'

const PHONE = '9497361560'
const BOOKING_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1r9yLOh-Z6nt5dZAgnKaR9iXZ6ea-kOkrJxLqctzq_0C4uLmNgX2FpB6zTQl26FqmN21-zAquz?gv=true'

const actions = [
  { label: 'Phone',       icon: Phone,          href: `tel:${PHONE}`,  ariaLabel: 'Call us' },
  { label: 'Text',        icon: MessageSquare,   href: `sms:${PHONE}?body=${encodeURIComponent('Hey UGC Fire, I am interested in your services.')}`,  ariaLabel: 'Text us' },
  { label: 'Book a Call', icon: CalendarCheck,   href: BOOKING_URL,     ariaLabel: 'Book a discovery call', target: '_blank' },
]

export default function HomeLeadBar() {
  return (
    <div
      className="lg:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#FF3B1A',
        boxShadow: '0 -2px 16px rgba(255,59,26,0.25)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ display: 'flex', width: '100%' }}>
        {actions.map(({ label, icon: Icon, href, ariaLabel, target }, i) => (
          <a
            key={label}
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            aria-label={ariaLabel}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 8px',
              color: '#ffffff',
              textDecoration: 'none',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.22)' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon size={20} strokeWidth={2} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
