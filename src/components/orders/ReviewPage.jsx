import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, Check, ImagePlus, RefreshCw, Star, X } from "lucide-react";

// ── Staged + existing image grid ─────────────────────────────────────────
function StagedImageGrid({ existingImages, stagedImages, onRemoveExisting, onRemoveStaged }) {
  const total = existingImages.length + stagedImages.length;
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {existingImages.map((img) => (
        <div key={img.url} className="relative w-16 h-16 shrink-0">
          <img
            src={img.url}
            alt="review"
            className="w-full h-full object-cover rounded-xl border border-amber-100"
          />
          <button
            type="button"
            onClick={() => onRemoveExisting(img.url)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center shadow cursor-pointer"
            aria-label="Remove image"
          >
            <X size={9} />
          </button>
        </div>
      ))}
      {stagedImages.map((s) => (
        <div key={s._uid} className="relative w-16 h-16 shrink-0">
          <img
            src={s.previewUrl}
            alt="staged"
            className="w-full h-full object-cover rounded-xl border border-amber-100"
          />
          <button
            type="button"
            onClick={() => onRemoveStaged(s._uid)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center shadow cursor-pointer"
            aria-label="Remove image"
          >
            <X size={9} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Desktop webcam modal ──────────────────────────────────────────────────
function WebcamModal({ onUsePhoto, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null); // data URL after snap
  const [camError, setCamError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  const startStream = useCallback(async (facing) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCamError(
        err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera permission in your browser."
          : "Could not access camera. Make sure no other app is using it."
      );
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCaptured(null);
    setCamError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    startStream(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, startStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.92));
    // Pause stream while previewing snapshot
    streamRef.current?.getTracks().forEach((t) => (t.enabled = false));
  };

  const handleRetake = () => {
    setCaptured(null);
    streamRef.current?.getTracks().forEach((t) => (t.enabled = true));
  };

  const handleUsePhoto = () => {
    if (!captured) return;
    // Convert data URL → Blob → File
    fetch(captured)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: "image/jpeg" });
        onUsePhoto(file);
      });
  };

  const toggleFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-display text-sm font-bold text-gray-800">Take a Photo</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {camError ? (
            <p className="text-white text-center text-sm px-6 leading-relaxed">{camError}</p>
          ) : (
            <>
              {/* Live preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${captured ? "hidden" : "block"}`}
              />
              {/* Snapshot preview */}
              {captured && (
                <img
                  src={captured}
                  alt="captured"
                  className="w-full h-full object-cover"
                />
              )}
            </>
          )}

          {/* Flip camera button (top-right corner of viewport) */}
          {!camError && !captured && (
            <button
              type="button"
              onClick={toggleFacing}
              className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
              aria-label="Flip camera"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        {/* Hidden canvas used for snapshot */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="px-5 py-4 flex items-center justify-between bg-gray-50">
          {captured ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-400"
              >
                <RefreshCw size={14} />
                Retake
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer px-4 py-2 rounded-xl"
              >
                <Check size={14} />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <div />
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!camError}
                className="w-14 h-14 rounded-full border-4 border-gray-800 bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center shadow-md"
                aria-label="Capture photo"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800" />
              </button>
              <div />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import {
  useAddReview,
  useUpdateReview,
  useMyReview,
  useUploadReviewImage,
} from "../../hookqueries/useProducts";
import { useToast } from "../../components/useToast";
const MAX_REVIEW_IMAGES = 3;
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

let _uidCounter = 0;
const uid = () => `rv-${++_uidCounter}`;

// True on any touch-first device (iOS, Android). Desktop browsers don't set these.
const isMobile = () =>
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  ("ontouchstart" in window && navigator.maxTouchPoints > 1);

// Props:
//   inlineItem / inlineInitialRating / onClose → used when opened as a desktop popup
//   (no props) → falls back to route-based usage (location.state)
export default function ReviewPage({ inlineItem, inlineInitialRating, onClose } = {}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve item from props (desktop popup) or route state (mobile navigate)
  const routeItem   = location.state?.item;
  const routeRating = location.state?.initialRating;
  const item          = inlineItem   ?? routeItem;
  const initialRating = inlineInitialRating ?? routeRating;

  // Route-based usage: redirect if no item passed via state
  useEffect(() => {
    if (!inlineItem && !routeItem) {
      navigate("/my-orders", { replace: true });
    }
  }, [inlineItem, routeItem, navigate]);

  // Dismiss: popup → call onClose; route → navigate back
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // ── Core review state ────────────────────────────────────────────────
  const [step, setStep] = useState(initialRating ? 2 : 1);
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  const [comboIndex, setComboIndex] = useState(0);
  const [comboReviews, setComboReviews] = useState([]);
  const currentProduct = item.isCombo && item.items ? item.items[comboIndex] : item;

  // ── Image state ──────────────────────────────────────────────────────
  const [existingImages, setExistingImages] = useState([]);
  const [stagedImages, setStagedImages] = useState([]);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const galleryInputRef = useRef(null);

  const totalImageCount = existingImages.length + stagedImages.length;
  const atMax = totalImageCount >= MAX_REVIEW_IMAGES;

  // ── Hooks ────────────────────────────────────────────────────────────
  const { setError: setToastError, setSuccess: setToastSuccess, displayedError, displayedType, toastVisible } = useToast();

  const addReviewMutation = useAddReview();
  const updateReviewMutation = useUpdateReview();
  const uploadReviewImageMutation = useUploadReviewImage();
  const { data: myReview } = useMyReview(currentProduct?.productId, item?.orderId);

  const submitting =
    addReviewMutation.isPending ||
    updateReviewMutation.isPending ||
    uploadReviewImageMutation.isPending;

  // ── Pre-populate when editing an existing review ─────────────────────
  useEffect(() => {
    if (myReview) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setRating(myReview.rating);
      setComment(myReview.comment || "");
      setReviewId(myReview.id);
      setIsEditing(true);
      if (Array.isArray(myReview.images) && myReview.images.length > 0) {
        setExistingImages(myReview.images.map((img) => ({
          url: typeof img === "string" ? img : img.url,
        })));
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [myReview]);

  // ── Stage a file (from gallery picker or webcam) ─────────────────────
  const stageFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setToastError(`"${file.name}" must be JPEG, PNG, or WebP.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setToastError(`"${file.name}" exceeds the 3 MB limit.`);
      return;
    }
    setStagedImages((prev) => [
      ...prev,
      { _uid: uid(), file, previewUrl: URL.createObjectURL(file) },
    ]);
  }, [setToastError]);

  const handleFilePick = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const available = MAX_REVIEW_IMAGES - totalImageCount;
    files.slice(0, available).forEach((f) => stageFile(f));
  }, [totalImageCount, stageFile]);

  const handleWebcamPhoto = useCallback((file) => {
    stageFile(file);
    setWebcamOpen(false);
  }, [stageFile]);

  const handleCameraClick = () => {
    if (atMax) return;
    if (isMobile()) {
      // On mobile: let the native <label> trigger open the camera input directly
      document.getElementById("review-camera-input")?.click();
    } else {
      setWebcamOpen(true);
    }
  };

  const removeExisting = (url) => {
    setExistingImages((prev) => prev.filter((img) => img.url !== url));
  };

  const removeStaged = (_uid) => {
    setStagedImages((prev) => {
      const target = prev.find((s) => s._uid === _uid);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s._uid !== _uid);
    });
  };

  // ── Rating labels ────────────────────────────────────────────────────
  const ratingLabels = ["Horrible", "Bad", "Average", "Good", "Excellent"];

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (item.isCombo && item.items && comboIndex < item.items.length - 1) {
      setComboReviews((prev) => [
        ...prev,
        {
          product: currentProduct,
          rating,
          comment,
          stagedImages: [...stagedImages],
          existingImages: [...existingImages]
        }
      ]);
      setRating(0);
      setComment("");
      setStagedImages([]);
      setExistingImages([]);
      setComboIndex((prev) => prev + 1);
      setStep(1);
      return;
    }

    const finalReview = {
      product: currentProduct,
      rating,
      comment,
      stagedImages,
      existingImages
    };
    const reviewsToSubmit = item.isCombo ? [...comboReviews, finalReview] : [finalReview];

    try {
      for (const rev of reviewsToSubmit) {
        const slug = rev.product.slug || rev.product.productSlug;
        if (!slug) {
          throw new Error(`Product slug is missing for ${rev.product.productName || rev.product.nameEn || "item"}`);
        }

        const newUrls = [];
        for (const staged of rev.stagedImages) {
          const formData = new FormData();
          formData.append("file", staged.file);
          formData.append("slug", slug);
          const result = await uploadReviewImageMutation.mutateAsync(formData);
          newUrls.push(result.url);
        }

        const imageUrls = [
          ...rev.existingImages.map((img) => img.url),
          ...newUrls,
        ];

        if (isEditing && reviewId && !item.isCombo) {
          await updateReviewMutation.mutateAsync({
            reviewId,
            rating: rev.rating,
            title: "",
            comment: rev.comment.trim(),
            productId: rev.product.productId,
            slug,
            imageUrls,
          });
        } else {
          await addReviewMutation.mutateAsync({
            productId: rev.product.productId,
            rating: rev.rating,
            title: "",
            comment: rev.comment.trim(),
            orderId: item.orderId,
            slug,
            imageUrls,
          });
        }
      }

      setToastSuccess(item.isCombo ? "All combo product reviews submitted successfully!" : "Review submitted successfully!");
      setDone(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setToastError("You have already reviewed one of the products in this order.");
      } else {
        setToastError(err.response?.data?.message || err.message || "Failed to submit reviews.");
      }
    }
  };

  // ── Early returns ────────────────────────────────────────────────────
  if (!item) return null;

  if (done) {
    return (
      // Mobile: full-screen  |  Desktop: centered dialog over backdrop
      <div className="fixed inset-0 z-50 flex items-center justify-center lg:bg-black/40 lg:backdrop-blur-sm">
        <div className="w-full h-full lg:h-auto lg:w-auto lg:min-w-[400px] lg:max-w-md lg:rounded-2xl lg:shadow-2xl bg-sandal-50 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-200">
              <Check size={28} />
            </div>
            <h3 className="font-display text-lg font-bold text-brand-900">Thank You!</h3>
            <p className="font-body text-sm text-gray-500 max-w-xs">
              Your review was submitted successfully.
            </p>
            <button
              onClick={handleClose}
              className="btn-md btn-primary w-full max-w-xs cursor-pointer animate-pulse"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop webcam modal */}
      {webcamOpen && (
        <WebcamModal
          onUsePhoto={handleWebcamPhoto}
          onClose={() => setWebcamOpen(false)}
        />
      )}

      {/*
        Mobile:  full-screen overlay (fixed inset-0)
        Desktop: backdrop + centered card with max-width, auto height
      */}
      <div className="fixed inset-0 z-50 flex items-start justify-center lg:items-center lg:bg-black/40 lg:backdrop-blur-sm lg:p-6">
      <div className="w-full h-full lg:h-auto lg:max-h-[92vh] lg:w-[520px] lg:rounded-2xl lg:shadow-2xl bg-sandal-50 flex flex-col transition-all duration-300 overflow-hidden">

        {/* Mobile-only hidden camera input — label trigger opens native camera directly */}
        <input
          id="review-camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFilePick}
        />
        {/* Gallery input — used on all devices */}
        <input
          ref={galleryInputRef}
          id="review-gallery-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFilePick}
        />

        {/* ── Toast ── */}
        <div className={`fixed top-4 right-4 z-[60] max-w-[calc(100vw-2rem)] sm:max-w-sm transition-all duration-300 ease-out ${toastVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}`}>
          {displayedError && (
            <div className={`flex items-start gap-3 bg-white shadow-2xl border rounded-2xl px-4 py-3.5 text-sm ${displayedType === "success" ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}`}>
              {displayedType === "success" ? <Check size={16} className="shrink-0 mt-0.5" /> : <X size={16} className="shrink-0 mt-0.5" />}
              <span className="leading-snug">{displayedError}</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="bg-gray-800 text-sandal-100 px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-700 rounded-lg text-sandal-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <h2 className="font-display text-sm sm:text-base font-bold flex-1 text-center pr-6">
            {item.isCombo ? `Review Item ${comboIndex + 1} of ${item.items.length}` : (isEditing ? "Edit Product Review" : "Review Product")}
          </h2>
        </div>

        {/* ── Step 1: Rate ── */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center justify-center space-y-6">
            {currentProduct.imageUrl || currentProduct.image ? (
              <img
                src={currentProduct.imageUrl || currentProduct.image}
                alt={currentProduct.productName}
                className="w-36 h-36 rounded-2xl object-cover border border-amber-100 bg-amber-50 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-36 h-36 rounded-2xl bg-sandal-50 text-brand-850 flex items-center justify-center shadow-sm shrink-0 border border-sandal-100 text-3xl font-bold">
                📦
              </div>
            )}
            <h3 className="font-body text-xs sm:text-sm font-bold text-gray-900 text-center max-w-xs leading-snug line-clamp-2">
              {currentProduct.productName}
            </h3>

            <div className="text-center space-y-1">
              <h4 className="font-display text-lg font-bold text-gray-900">Rate the product</h4>
              <p className="font-body text-xs text-gray-500">
                How did you find this product based on your usage?
              </p>
            </div>

            <div className="flex justify-between w-full max-w-xs px-2 pt-2 gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => {
                const isSelected = s <= rating;
                return (
                  <div key={s} className="flex flex-col items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setRating(s)}
                      className="cursor-pointer transition-transform hover:scale-115 active:scale-95"
                      aria-label={`Rate ${s} star`}
                    >
                      <Star
                        size={32}
                        className={isSelected ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
                      />
                    </button>
                    <span className={`font-body text-[9px] sm:text-[10px] font-medium leading-none ${isSelected ? "text-amber-700 font-bold" : "text-gray-400"}`}>
                      {ratingLabels[s - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Write & attach photos ── */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-4.5 flex flex-col space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-100/40 pb-3.5 shrink-0">
              {currentProduct.imageUrl || currentProduct.image ? (
                <img
                  src={currentProduct.imageUrl || currentProduct.image}
                  alt={currentProduct.productName}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-100 bg-amber-50"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-sandal-50 text-brand-850 flex items-center justify-center shrink-0 border border-sandal-100 text-lg font-bold">
                  📦
                </div>
              )}
              <div className="min-w-0">
                <p className="font-body text-xs font-bold text-gray-900 line-clamp-1 leading-snug">
                  {currentProduct.productName}
                </p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="cursor-pointer transition-transform active:scale-90"
                      aria-label={`Change rating to ${s} stars`}
                    >
                      <Star
                        size={15}
                        className={s <= rating ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card flex-1 flex flex-col min-h-[120px] p-4 sm:p-5 space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="More detailed reviews get more visibility..."
                className="flex-1 w-full font-body text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:ring-0 pt-1"
              />

              <StagedImageGrid
                existingImages={existingImages}
                stagedImages={stagedImages}
                onRemoveExisting={removeExisting}
                onRemoveStaged={removeStaged}
              />
            </div>
          </div>
        )}

        {/* ── Footer: Step 1 ── */}
        {step === 1 && (
          <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between bg-gray-50 shrink-0">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sandal-600" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!rating}
              className="text-sm font-bold text-sandal-700 hover:text-sandal-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              NEXT
            </button>
          </div>
        )}

        {/* ── Footer: Step 2 ── */}
        {step === 2 && (
          <div className="border-t border-gray-100 px-4 py-3.5 flex items-center justify-between bg-gray-50 shrink-0">
            {/* Left: camera + gallery */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={atMax}
                onClick={handleCameraClick}
                title={atMax ? `Max ${MAX_REVIEW_IMAGES} images` : "Take a photo"}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-colors ${
                  atMax
                    ? "text-gray-300 border-gray-200 cursor-not-allowed"
                    : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700 cursor-pointer"
                }`}
              >
                <Camera size={13} />
                Camera
              </button>
              <label
                htmlFor={atMax ? undefined : "review-gallery-input"}
                aria-disabled={atMax}
                title={atMax ? `Max ${MAX_REVIEW_IMAGES} images` : "Choose from gallery"}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-colors ${
                  atMax
                    ? "text-gray-300 border-gray-200 cursor-not-allowed pointer-events-none"
                    : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700 cursor-pointer"
                }`}
              >
                <ImagePlus size={13} />
                {totalImageCount > 0 ? `${totalImageCount} of ${MAX_REVIEW_IMAGES}` : "Gallery"}
              </label>
            </div>

            {/* Center: step dots */}
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-sandal-600" />
            </div>

            {/* Right: submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm font-bold text-sandal-700 hover:text-sandal-900 disabled:opacity-40 transition-colors cursor-pointer uppercase"
            >
              {submitting ? "Submitting…" : (item.isCombo && comboIndex < item.items.length - 1 ? "Next Product" : (comment.trim() ? "Submit" : "Skip & Finish"))}
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
