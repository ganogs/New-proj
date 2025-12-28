document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('post-form');
  const textArea = document.getElementById('post-text');
  const imageInput = document.getElementById('image-upload');
  const imagePreview = document.getElementById('image-preview');
  const shareBtns = {
    facebook: document.getElementById('share-facebook'),
    linkedin: document.getElementById('share-linkedin'),
    whatsapp: document.getElementById('share-whatsapp')
  };
  const messageDiv = document.getElementById('message');

  let postId = null;
  let postText = '';
  let shareUrl = '';

  // Image preview
  imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Image size too large. Max 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(evt) {
        imagePreview.src = evt.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    postText = textArea.value.trim();
    if (!postText) {
      showMessage('Please enter some text.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('text', postText);
    const imageFile = imageInput.files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      postId = data.id;
      shareUrl = `${window.location.origin}${window.location.pathname}?postId=${postId}`;

      showMessage('Post created successfully! You can now share it.', 'success');
      enableShareButtons();
      setupShareHandlers();
    } catch (error) {
      console.error('Error creating post:', error);
      showMessage('Failed to create post. Is the backend running?', 'error');
    }
  });

  function enableShareButtons() {
    Object.values(shareBtns).forEach(btn => {
      btn.disabled = false;
    });
  }

  function setupShareHandlers() {
    // Facebook Sharer
    shareBtns.facebook.addEventListener('click', function() {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'width=600,height=400');
    });

    // LinkedIn Share
    shareBtns.linkedin.addEventListener('click', function() {
      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'width=600,height=500');
    });

    // WhatsApp
    shareBtns.whatsapp.addEventListener('click', function() {
      const text = `${postText} ${shareUrl}`;
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    });
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    if (type === 'success') {
      messageDiv.style.display = 'block';
    } else {
      messageDiv.style.display = 'block';
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }

  // Check for existing postId in URL on load (for sharing view)
  const urlParams = new URLSearchParams(window.location.search);
  postId = urlParams.get('postId');
  if (postId) {
    // Optionally fetch and display the post, but for now, just enable shares if text is present
    if (postText || textArea.value) {
      enableShareButtons();
      setupShareHandlers();
    }
  }
});
