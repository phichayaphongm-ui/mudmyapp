'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Camera, Loader2, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { getReviews, addReview } from '@/lib/services/reviews'
import { uploadReviewImage } from '@/lib/services/storage'
import { cn } from '@/lib/utils'
import { compressImage } from '@/lib/utils/image'
import type { Review } from '@/lib/types'
import { toast } from 'sonner'

interface ReviewSectionProps {
  pinId: string
  compact?: boolean
}

export function ReviewSection({ pinId, compact = false }: ReviewSectionProps) {
  const { user, isBanned } = useAuth()
  const { t, lang } = useLanguage()
  const router = useRouter()
  const banStatus = isBanned()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // Image Upload State
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const MAX_IMAGES = 1

  useEffect(() => {
    let mounted = true
    setLoadingReviews(true)
    getReviews(pinId).then(data => {
      if (mounted) {
        setReviews(data)
        setLoadingReviews(false)
      }
    })
    return () => { mounted = false }
  }, [pinId])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const selectedFiles = Array.from(e.target.files)
    
    // Check max Limit
    if (images.length + selectedFiles.length > MAX_IMAGES) {
      toast.error(t('pinDetail.maxImagesError') || `สามารถอัปโหลดได้สูงสุด ${MAX_IMAGES} รูป`)
      return
    }

    const validFiles = selectedFiles.filter(file => file.type.startsWith('image/'))
    
    // Compress files before setting to state
    const compressedFiles = await Promise.all(
      validFiles.map(file => compressImage(file))
    )
    
    setImages(prev => [...prev, ...compressedFiles])
    
    const newPreviews = compressedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviews])
    
    // Reset input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      const newUrls = [...prev]
      URL.revokeObjectURL(newUrls[index])
      return newUrls.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return

    setSubmittingReview(true)
    try {
      // Create a temporary review ID for storage path
      const tempReviewId = Math.random().toString(36).substring(2, 10)
      
      const uploadedImageUrls: string[] = []
      
      // Upload Images
      for (let i = 0; i < images.length; i++) {
        const url = await uploadReviewImage(images[i], pinId, tempReviewId, i)
        uploadedImageUrls.push(url)
      }

      await addReview(pinId, {
        pinId,
        userId: user.id,
        userName: user.nickname || user.name || 'User',
        userAvatar: user.avatar,
        rating: newRating,
        comment: newComment,
        images: uploadedImageUrls
      })

      // Reset form
      setNewComment('')
      setNewRating(5)
      setImages([])
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setPreviewUrls([])
      
      toast.success(t('pinDetail.reviewSuccess') || 'รีวิวเรียบร้อยแล้ว')

      // Refresh reviews
      const updated = await getReviews(pinId)
      setReviews(updated)
    } catch (e) {
      console.error(e)
      toast.error(t('common.error'))
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-1">
        <h3 className={cn("font-black text-foreground flex items-center gap-2 tracking-tight", !compact && "text-lg")}>
          {t('pinDetail.reviews')} 
          <span className="text-muted-foreground font-bold text-xs bg-zinc-100 px-2 py-0.5 rounded-full">
            {reviews.length}
          </span>
        </h3>
      </div>

      {/* Post Review Form */}
      {user ? (
        !banStatus.banned ? (
          <div className={cn("bg-zinc-50 rounded-[2rem] p-4 space-y-4 border border-zinc-100", !compact && "p-6")}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('pinDetail.rating')}:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setNewRating(s)}
                    className="transition-all hover:scale-125 focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        "w-7 h-7 transition-colors", 
                        s <= newRating ? "fill-orange-500 text-orange-500 shadow-sm" : "text-zinc-300"
                      )} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative space-y-4">
              <textarea
                placeholder={t('pinDetail.addReview')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all outline-none min-h-[120px] resize-none font-medium shadow-sm"
              />
              
              {/* Image Previews */}
              {previewUrls.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                      <img src={url} alt="Review upload" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all hover:bg-black/80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="relative">
                  <input 
                    type="file" 
                    id={`review-image-upload-${pinId}`} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageSelect}
                    disabled={images.length >= MAX_IMAGES || submittingReview}
                  />
                   <label 
                    htmlFor={`review-image-upload-${pinId}`}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm border",
                      images.length >= MAX_IMAGES 
                        ? "text-zinc-400 bg-zinc-50 border-zinc-100 cursor-not-allowed" 
                        : "text-zinc-700 bg-white border-zinc-200 hover:border-primary/50 hover:bg-zinc-50"
                    )}
                  >
                    <Camera className="w-4 h-4" />
                    <span>อัปโหลดรูป ({images.length}/{MAX_IMAGES})</span>
                  </label>
                </div>

                <Button 
                  size={compact ? "sm" : "default"}
                  disabled={!newComment.trim() || submittingReview}
                  onClick={handleSubmit}
                  className="rounded-xl font-black px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                >
                  {submittingReview ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.loading')}</>
                  ) : (
                    t('pinDetail.submitReview')
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-red-50 border border-red-100 rounded-[2rem] shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3 opacity-80" />
            <p className="text-sm text-red-700 font-black">{t('common.banWarning')}</p>
          </div>
        )
      ) : (
        <div className="text-center p-10 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
          <p className="text-sm text-muted-foreground font-black tracking-tight">{t('pinDetail.writeReviewLogin')}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 rounded-xl font-black border-zinc-300 text-zinc-600"
            onClick={() => router.push('/login')}
          >
            ไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {loadingReviews ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">กำลังโหลดรีวิว...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-8">
            {reviews.map((rev) => (
              <div key={rev.id} className="flex gap-4 group">
                <Avatar className={cn("shrink-0 shadow-md border-2 border-white", compact ? "w-10 h-10" : "w-12 h-12")}>
                  <AvatarImage src={rev.userAvatar} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-900 font-black">
                    {rev.userName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-black text-zinc-900 block leading-tight">{rev.userName}</span>
                      <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { 
                          year: 'numeric', month: 'short', day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-100 shadow-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "w-3 h-3", 
                            i < rev.rating ? "fill-orange-500 text-orange-500" : "text-zinc-200"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-zinc-50 shadow-sm group-hover:border-zinc-200 transition-colors">
                    {rev.comment}
                  </p>
                  
                  {/* Display Review Images */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rev.images.map((img, i) => (
                        <Dialog key={i}>
                          <DialogTrigger asChild>
                            <button className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-all">
                              <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-1 bg-transparent border-none shadow-none">
                            <DialogTitle className="sr-only">Image Preview</DialogTitle>
                            <img src={img} alt="Review attachment full" className="w-full h-auto max-h-[85vh] object-contain rounded-[2rem] shadow-2xl" />
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-zinc-50/50 rounded-[2rem] border border-dashed border-zinc-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Star className="w-6 h-6 text-zinc-200" />
            </div>
            <p className="text-sm text-muted-foreground font-black tracking-tight">{t('pinDetail.noReviews')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
