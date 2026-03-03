import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DesignerGalleryPage.css';

export default function DesignerGalleryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState(null);

  const designerId = location.state?.designerId || 1;

  const galleryImages = [
    { id: 1, title: '푸들 미용', image: '🐩', type: '푸들' },
    { id: 2, title: '말티즈 미용', image: '🐕‍🦺', type: '말티즈' },
    { id: 3, title: '시추 미용', image: '🐕', type: '시추' },
    { id: 4, title: '푸들 컷', image: '🐩', type: '푸들' },
    { id: 5, title: '포메라니안 미용', image: '🐕', type: '포메라니안' },
    { id: 6, title: '비숑 미용', image: '🐕', type: '비숑' },
    { id: 7, title: '골든 리트리버', image: '🐕', type: '골든' },
    { id: 8, title: '라브라도', image: '🐕', type: '라브라도' },
    { id: 9, title: '요크셔테리어', image: '🐩', type: '요크셔' },
  ];

  return (
    <div className="designer-gallery-page" data-node-id="designer-gallery">
      {/* Header */}
      <div className="gallery-header">
        <button className="gallery-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>포트폴리오</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Gallery Container */}
      <div className="gallery-container">
        <div className="gallery-grid">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="gallery-item"
              onClick={() => setSelectedImage(image)}
            >
              <div className="gallery-image-box">{image.image}</div>
              <h4>{image.title}</h4>
              <p>{image.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="gallery-modal" onClick={() => setSelectedImage(null)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedImage(null)}>×</button>
            <div className="modal-image-box">{selectedImage.image}</div>
            <h3>{selectedImage.title}</h3>
            <p>{selectedImage.type}</p>
            <button className="modal-contact-btn" onClick={() => navigate('/chat')}>
              미용사에게 문의
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="gallery-nav">
        <button onClick={() => navigate('/dashboard')}>🏠</button>
        <button onClick={() => navigate('/designer-list')}>💼</button>
        <button onClick={() => navigate('/chat')}>💬</button>
        <button onClick={() => navigate('/mypage')}>👤</button>
      </div>
    </div>
  );
}
