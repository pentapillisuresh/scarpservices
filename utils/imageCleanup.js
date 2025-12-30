const fs = require('fs');
const path = require('path');

class ImageCleanup {
  // Clean up orphaned images
  static async cleanupOrphanedImages() {
    try {
      const folders = ['scrap-images', 'profile-images', 'category-icons'];
      const orphanedFiles = [];
      
      for (const folder of folders) {
        const folderPath = path.join(__dirname, '..', 'uploads', folder);
        
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath);
          
          for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            
            // Check if file is older than 30 days (temporary cleanup)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            if (stats.mtime < thirtyDaysAgo && file.startsWith('temp-')) {
              fs.unlinkSync(filePath);
              orphanedFiles.push(filePath);
            }
          }
        }
      }
      
      console.log(`Cleaned up ${orphanedFiles.length} orphaned image files`);
      return orphanedFiles;
    } catch (error) {
      console.error('Image cleanup error:', error);
      return [];
    }
  }
  
  // Delete image file
  static deleteImageFile(imagePath) {
    try {
      if (imagePath) {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }
  
  // Validate image exists
  static imageExists(imagePath) {
    try {
      if (!imagePath) return false;
      const fullPath = path.join(__dirname, '..', imagePath);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }
}

module.exports = ImageCleanup;