import { IndianRupee, Upload, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useSheetAuth } from "../hooks/useSheetAuth";
import { createPostHistoryRecord, saveTaskToSheet } from "../utils/sheetdb";

interface PostTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskPosted?: () => void;
}

const categories = [
  "Delivery",
  "Cleaning",
  "Repair",
  "Shopping",
  "Pet Care",
  "Tutoring",
  "Photography",
  "Other",
];

function generateTaskId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `task_${ts}_${rand}`;
}

export default function PostTaskModal({
  isOpen,
  onClose,
  onTaskPosted,
}: PostTaskModalProps) {
  const { currentUser: sheetUser } = useSheetAuth();

  const [formData, setFormData] = useState({
    title: "",
    category: categories[0],
    price: "",
    location: "",
    safeSpot: "",
    deadline: "",
    description: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: categories[0],
      price: "",
      location: "",
      safeSpot: "",
      deadline: "",
      description: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sheetUser) {
      toast.error("Please log in to post a task.");
      return;
    }

    if (!photoFile) {
      toast.error("Please upload a task photo");
      return;
    }

    setIsSubmitting(true);
    try {
      const photoDataUrl = photoPreview ?? "";

      const task_id = generateTaskId();
      const now = new Date();
      const datePosted = now.toISOString().split("T")[0]; // YYYY-MM-DD

      await saveTaskToSheet({
        task_photo: photoDataUrl,
        task_id,
        user_id_originator: sheetUser.user_id,
        task_name: formData.title,
        price: formData.price,
        status: "active",
        location: `${formData.location}${formData.safeSpot ? ` | Safe spot: ${formData.safeSpot}` : ""}`,
        description: formData.description,
        date_posted: datePosted,
        deadline: formData.deadline || undefined,
        category: formData.category,
      });

      await createPostHistoryRecord(
        sheetUser.user_id,
        task_id,
        formData.title,
        datePosted,
      );

      toast.success("Task posted successfully!");
      resetForm();
      onClose();
      onTaskPosted?.();
    } catch (error: any) {
      console.error("Error posting task:", error);
      toast.error(error.message || "Failed to post task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Post New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            disabled={isSubmitting}
            data-ocid="post_task.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Photo */}
          <div>
            <label
              htmlFor="task-photo"
              className="block text-sm font-medium mb-2"
            >
              Task Photo *
            </label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90"
                    data-ocid="post_task.photo.delete_button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="task-photo" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload task photo
                  </p>
                  <input
                    id="task-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    data-ocid="post_task.photo.upload_button"
                    required
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium mb-2"
            >
              Title (Task Name) *
            </label>
            <input
              id="task-title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Make notes on my behalf"
              required
              data-ocid="post_task.title.input"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="task-category"
              className="block text-sm font-medium mb-2"
            >
              Category *
            </label>
            <select
              id="task-category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
              data-ocid="post_task.category.select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="task-price"
              className="flex items-center gap-1 text-sm font-medium mb-2"
            >
              <IndianRupee className="w-4 h-4" />
              Price (Amount in ₹) *
            </label>
            <input
              id="task-price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter amount in ₹"
              min="1"
              required
              data-ocid="post_task.price.input"
            />
          </div>

          {/* Location & Safe Spot */}
          <div className="space-y-3">
            <label
              htmlFor="task-location"
              className="block text-sm font-medium"
            >
              Location &amp; Safe Spot *
            </label>
            <input
              id="task-location"
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., ABC University"
              required
              data-ocid="post_task.location.input"
            />
            <input
              id="task-safe-spot"
              type="text"
              value={formData.safeSpot}
              onChange={(e) =>
                setFormData({ ...formData, safeSpot: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Safe spot, e.g., Near A1 building"
              data-ocid="post_task.safe_spot.input"
            />
          </div>

          {/* Deadline & Description */}
          <div className="space-y-3">
            <label
              htmlFor="task-deadline"
              className="block text-sm font-medium"
            >
              Deadline &amp; Description
            </label>
            <input
              id="task-deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              data-ocid="post_task.deadline.input"
            />
            <textarea
              id="task-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Describe the task in detail..."
              rows={4}
              data-ocid="post_task.description.textarea"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-ocid="post_task.submit_button"
          >
            {isSubmitting ? "Posting Task..." : "Post Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
