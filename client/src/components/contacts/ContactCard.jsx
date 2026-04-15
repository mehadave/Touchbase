import { MapPin } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import StarRating from '../ui/StarRating.jsx'
import { CategoryBadge, TagBadge } from '../ui/Badge.jsx'
import { stalenessInfo, lastContactedLabel } from '../../utils/contact.js'

const stalenessStyle = {
  overdue: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  soon:    'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  ok:      'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  none:    'text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
}

const dotColor = {
  overdue: 'bg-red-500',
  soon:    'bg-amber-400',
  ok:      'bg-green-500',
  none:    'bg-gray-300',
}

export default function ContactCard({ contact, onClick }) {
  const info      = stalenessInfo(contact)
  const MAX_TAGS  = 3
  const visibleTags   = contact.tags?.slice(0, MAX_TAGS) || []
  const extraTagCount = (contact.tags?.length || 0) - MAX_TAGS

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <Avatar name={contact.fullName} photoPath={contact.photoPath} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {contact.fullName}
              </h3>
              {(contact.jobTitle || contact.company) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {contact.jobTitle}{contact.jobTitle && contact.company ? ' · ' : ''}{contact.company}
                </p>
              )}
            </div>
            <CategoryBadge category={contact.category} />
          </div>
          <div className="mt-1.5">
            <StarRating value={contact.relationshipStrength} readOnly size={12} />
          </div>
        </div>
      </div>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map(tag => (
            <TagBadge key={tag.name || tag} name={tag.name || tag} />
          ))}
          {extraTagCount > 0 && (
            <span className="text-xs text-gray-400 px-1.5 py-0.5">+{extraTagCount} more</span>
          )}
        </div>
      )}

      {/* Conference badge */}
      {contact.conferenceId && (
        <div className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
          <MapPin size={10} />
          Met at conference
        </div>
      )}

      {/* Staleness footer */}
      <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border text-xs font-medium ${stalenessStyle[info.status]}`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor[info.status]}`} />
          {lastContactedLabel(contact)}
        </div>
        <span>{info.label}</span>
      </div>
    </div>
  )
}
