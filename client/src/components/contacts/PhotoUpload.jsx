import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { uploadPhoto } from '../../api/contacts.js'
import { useUIStore } from '../../store/useUIStore.js'

export default function PhotoUpload({ contact, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const { addToast } = useUIStore()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadPhoto(contact.id, file)
      onUpdate?.(result.contact)
      addToast('Photo updated')
    } catch {
      addToast('Failed to upload photo', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="relative group inline-block">
      <Avatar name={contact.fullName} photoPath={contact.photoPath} size="xl" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {uploading
          ? <Loader2 size={24} className="text-white animate-spin" />
          : <Camera size={24} className="text-white" />
        }
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
