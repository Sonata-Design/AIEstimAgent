import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Calendar, MapPin } from "lucide-react";

interface ProgressPhoto {
  id: string;
  url: string;
  filename: string;
  description: string;
  location: string;
  takenAt: Date;
  tags: string[];
}

interface ProgressPhotosProps {
  projectId: string;
  photos?: ProgressPhoto[];
  onPhotosUpdate?: (photos: ProgressPhoto[]) => void;
}

export function ProgressPhotos({ projectId, photos = [], onPhotosUpdate }: ProgressPhotosProps) {
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    description: "",
    location: "",
    tags: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = async () => {
    if (!selectedFile) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, you'd upload to your server/cloud storage
      // For now, we'll simulate with a local URL
      const photoUrl = previewUrl;
      
      const newProgressPhoto: ProgressPhoto = {
        id: `photo-${Date.now()}`,
        url: photoUrl,
        filename: selectedFile.name,
        description: newPhoto.description,
        location: newPhoto.location,
        takenAt: new Date(),
        tags: newPhoto.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      const updatedPhotos = [...photos, newProgressPhoto];
      onPhotosUpdate?.(updatedPhotos);

      // Reset form
      setNewPhoto({ description: "", location: "", tags: "" });
      setSelectedFile(null);
      setPreviewUrl("");
      setIsAddingPhoto(false);

      toast({
        title: "Photo Added",
        description: "Progress photo has been added successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to add progress photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosUpdate?.(updatedPhotos);
    
    toast({
      title: "Photo Removed",
      description: "Progress photo has been removed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Photo Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Progress Photos</h3>
          <p className="text-sm text-slate-600">Document project progress with photos and annotations</p>
        </div>
        
        <Dialog open={isAddingPhoto} onOpenChange={setIsAddingPhoto}>
          <DialogTrigger asChild>
            <Button>
              <Camera className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Progress Photo</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="photo-upload">Photo</Label>
                <div className="mt-2">
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mb-4"
                  />
                  
                  {previewUrl && (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="photo-description">Description</Label>
                <Textarea
                  id="photo-description"
                  value={newPhoto.description}
                  onChange={(e) => setNewPhoto({
                    ...newPhoto,
                    description: e.target.value
                  })}
                  placeholder="Describe what this photo shows..."
                  rows={3}
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="photo-location">Location/Area</Label>
                <Input
                  id="photo-location"
                  value={newPhoto.location}
                  onChange={(e) => setNewPhoto({
                    ...newPhoto,
                    location: e.target.value
                  })}
                  placeholder="e.g., Kitchen, Second Floor, Foundation"
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="photo-tags">Tags (comma-separated)</Label>
                <Input
                  id="photo-tags"
                  value={newPhoto.tags}
                  onChange={(e) => setNewPhoto({
                    ...newPhoto,
                    tags: e.target.value
                  })}
                  placeholder="e.g., framing, electrical, before, after"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleAddPhoto} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
                <Button variant="outline" onClick={() => setIsAddingPhoto(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card key={photo.id}>
              <CardHeader className="pb-2">
                <div className="relative">
                  <img
                    src={photo.url}
                    alt={photo.description}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                    onClick={() => handleRemovePhoto(photo.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  {photo.description || "No description"}
                </p>
                
                {photo.location && (
                  <div className="flex items-center text-xs text-slate-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {photo.location}
                  </div>
                )}
                
                <div className="flex items-center text-xs text-slate-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {photo.takenAt.toLocaleDateString()}
                </div>
                
                {photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <Camera className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No progress photos</h3>
          <p className="mt-1 text-sm text-slate-500">
            Start documenting your project by adding progress photos.
          </p>
          <Button
            className="mt-4"
            onClick={() => setIsAddingPhoto(true)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Add First Photo
          </Button>
        </div>
      )}
    </div>
  );
}