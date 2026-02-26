import React, { useState } from 'react';
import { X, Upload, IndianRupee } from 'lucide-react';
import { useCreateTask } from '../hooks/useTasks';
import { useActor } from '../hooks/useActor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { datetimeLocalToTime } from '../utils/time';

interface PostTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  'Delivery',
  'Cleaning',
  'Repair',
  'Shopping',
  'Pet Care',
  'Tutoring',
  'Photography',
  'Other',
];

export default function PostTaskModal({ isOpen, onClose }: PostTaskModalProps) {
  const { actor, isFetching: actorLoading } = useActor();
  const createTask = useCreateTask();
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    price: '',
    location: '',
    safeSpot: '',
    telegramHandle: '',
    deadline: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actor) {
      toast.error('Connection not ready. Please wait a moment and try again.');
      return;
    }

    if (!photoFile) {
      toast.error('Please upload a task photo');
      return;
    }

    try {
      setUploadProgress(0);
      const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
      const photoBlob = ExternalBlob.fromBytes(photoBytes).withUploadProgress(
        (percentage) => setUploadProgress(percentage)
      );

      const deadline = datetimeLocalToTime(formData.deadline);

      await createTask.mutateAsync({
        title: formData.title,
        category: formData.category,
        price: BigInt(formData.price),
        location: formData.location,
        safeSpot: formData.safeSpot,
        telegramHandle: formData.telegramHandle,
        photo: photoBlob,
        deadline,
      });

      toast.success('Task posted successfully!');
      onClose();
      setFormData({
        title: '',
        category: categories[0],
        price: '',
        location: '',
        safeSpot: '',
        telegramHandle: '',
        deadline: '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  if (!isOpen) return null;

  const isSubmitting = createTask.isPending;
  const isActorReady = !!actor && !actorLoading;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Post New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isActorReady && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
              Initializing connection... Please wait.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Task Photo *</label>
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
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload task photo
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    required
                  />
                </label>
              )}
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Deliver groceries to my home"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium mb-2">
              <IndianRupee className="w-4 h-4" />
              Price *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter amount in rupees"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Koramangala, Bangalore"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Safe Spot *</label>
            <input
              type="text"
              value={formData.safeSpot}
              onChange={(e) => setFormData({ ...formData, safeSpot: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Near Cafe Coffee Day"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Telegram Handle *</label>
            <input
              type="text"
              value={formData.telegramHandle}
              onChange={(e) =>
                setFormData({ ...formData, telegramHandle: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="@yourusername"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isActorReady}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Posting Task...'
              : !isActorReady
                ? 'Connecting...'
                : 'Post Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
