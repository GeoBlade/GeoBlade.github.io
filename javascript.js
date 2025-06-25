const mapContainer = document.getElementById('map-container');
    const tokenSizeInput = document.getElementById('tokenSize');
    const tokenNameInput = document.getElementById('tokenName');
    const initiativeOrder = document.getElementById('initiative-order');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    const tokenBorderColorInput = document.getElementById('tokenBorderColor');
    const tokenBorderToggle = document.getElementById('tokenBorderToggle');
    let dragToken = null;
    let pickedUpToken = null;
    window.tokens = []; // Track all tokens and their data

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      if (sidebar.classList.contains('hidden')) {
        toggleBtn.style.right = '0';
      } else {
        toggleBtn.style.right = '250px';
      }
    });

    document.getElementById('mapUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          mapContainer.style.backgroundImage = `url(${e.target.result})`;
          window.currentMapSrc = e.target.result; // <-- Save the map image data
        };
        reader.readAsDataURL(file);
      }
    });

    function addToken() {
      const file = document.getElementById('tokenUpload').files[0];
      if (!file) return;

      const size = parseInt(tokenSizeInput.value);
      const name = tokenNameInput.value || `Token ${initiativeOrder.children.length + 1}`;
      const borderColor = tokenBorderColorInput.value;
      const showBorder = tokenBorderToggle.checked;
      const reader = new FileReader();
      reader.onload = (e) => {
        const token = document.createElement('img');
        token.src = e.target.result;
        token.className = 'token';
        token.style.width = `${size}px`;
        token.style.height = `${size}px`;
        token.style.left = '10px';
        token.style.top = '10px';
        token.title = name;

        // Store border info for reference (optional)
        token.dataset.borderColor = borderColor;
        token.dataset.hasBorder = showBorder ? "true" : "false";

        // Set border color and visibility ONCE at creation
        if (showBorder) {
          token.style.border = `3px solid ${borderColor}`;
        } else {
          token.style.border = 'none';
        }

        // Store token data in window.tokens
        const tokenData = {
          src: token.src,
          name,
          size,
          borderColor,
          showBorder,
          left: 10,
          top: 10
        };
        window.tokens.push(tokenData);
        token.dataset.tokenIndex = window.tokens.length - 1;

        makeDraggable(token);
        mapContainer.appendChild(token);

        const li = document.createElement('li');
        li.textContent = name;
        li.setAttribute('draggable', 'true');

        // Create a delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.style.width = '30px';
        deleteBtn.style.height = '30px';
        deleteBtn.style.background = '#a00';
        deleteBtn.style.color = '#fff';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.title = 'Delete Token';

        // When clicked, remove both the token and the initiative entry
        deleteBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (token.parentNode) token.parentNode.removeChild(token);
          if (li.parentNode) li.parentNode.removeChild(li);
          // Remove from window.tokens
          const idx = parseInt(token.dataset.tokenIndex, 10);
          window.tokens.splice(idx, 1);
          // Update tokenIndex for remaining tokens
          Array.from(mapContainer.querySelectorAll('.token')).forEach((img, i) => {
            img.dataset.tokenIndex = i;
          });
        });

        li.appendChild(deleteBtn);
        initiativeOrder.appendChild(li);
      };
      reader.readAsDataURL(file);
    }

    function makeDraggable(token) {
      token.addEventListener('click', function (e) {
        e.stopPropagation();
        if (pickedUpToken === token) {
          // Already picked up, drop it (do nothing)
          pickedUpToken.classList.remove('picked-up');
          pickedUpToken = null;
        } else {
          // Pick up this token
          if (pickedUpToken) pickedUpToken.classList.remove('picked-up');
          pickedUpToken = token;
          pickedUpToken.classList.add('picked-up');
        }
      });
    }

    // Listen for clicks on the map to drop the token
    mapContainer.addEventListener('click', function (e) {
      if (pickedUpToken) {
        // Calculate position relative to map container
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left - pickedUpToken.offsetWidth / 2;
        const y = e.clientY - rect.top - pickedUpToken.offsetHeight / 2;
        pickedUpToken.style.left = `${x}px`;
        pickedUpToken.style.top = `${y}px`;
        // Update position in window.tokens
        const idx = parseInt(pickedUpToken.dataset.tokenIndex, 10);
        if (window.tokens[idx]) {
          window.tokens[idx].left = x;
          window.tokens[idx].top = y;
        }
        pickedUpToken.classList.remove('picked-up');
        pickedUpToken = null;
      }
    });

    // Optional: Add a CSS class for visual feedback
    // Add this to your CSS file or <style> section:
    /*
    
    */

    // Make initiative order sortable
    let draggedItem;
    initiativeOrder.addEventListener('dragstart', function (e) {
      draggedItem = e.target;
      e.target.style.opacity = 0.5;
    });

    initiativeOrder.addEventListener('dragend', function (e) {
      e.target.style.opacity = '';
    });

    initiativeOrder.addEventListener('dragover', function (e) {
      e.preventDefault();
    });

    initiativeOrder.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.target.tagName === 'LI' && e.target !== draggedItem) {
        initiativeOrder.insertBefore(draggedItem, e.target.nextSibling);
      }
    });

    // Make list items draggable
    new MutationObserver(() => {
      Array.from(initiativeOrder.children).forEach((li) => {
        li.setAttribute('draggable', 'true');
      });
    }).observe(initiativeOrder, { childList: true });

    // Helper: Get current world state
function getWorldState() {
  return {
    map: window.currentMapSrc || null, // <-- Save the map image data
    tokens: window.tokens || [],
    initiativeOrder: Array.from(document.querySelectorAll('#initiative-order li')).map(li => li.textContent)
  };
}

// Helper: Restore world state
function setWorldState(state) {
  // Restore map
  if (state.map) {
    window.currentMapSrc = state.map;
    mapContainer.style.backgroundImage = `url('${state.map}')`; // <-- Restore to mapContainer
  }
  // Restore tokens
  window.tokens = state.tokens || [];
  // Clear and re-add tokens to the map
  renderTokens();

  // Restore initiative order
  const ul = document.getElementById('initiative-order');
  ul.innerHTML = '';
  (state.initiativeOrder || []).forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    ul.appendChild(li);
  });
}

// Render tokens from window.tokens
function renderTokens() {
  // Remove all current tokens
  Array.from(mapContainer.querySelectorAll('.token')).forEach(token => token.remove());
  window.tokens.forEach((data, idx) => {
    const token = document.createElement('img');
    token.src = data.src;
    token.className = 'token';
    token.style.width = `${data.size}px`;
    token.style.height = `${data.size}px`;
    token.style.left = `${data.left}px`;
    token.style.top = `${data.top}px`;
    token.title = data.name;
    token.dataset.borderColor = data.borderColor;
    token.dataset.hasBorder = data.showBorder ? "true" : "false";
    token.dataset.tokenIndex = idx;
    if (data.showBorder) {
      token.style.border = `3px solid ${data.borderColor}`;
    } else {
      token.style.border = 'none';
    }
    makeDraggable(token);
    mapContainer.appendChild(token);
  });
}

// Save World
document.getElementById('saveWorldBtn').onclick = function() {
  const state = getWorldState();
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'geoblade-world.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

// Load World
document.getElementById('loadWorldBtn').onclick = function() {
  document.getElementById('loadWorldInput').click();
};
document.getElementById('loadWorldInput').onchange = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const state = JSON.parse(evt.target.result);
      setWorldState(state);
    } catch (err) {
      alert('Invalid world file!');
    }
  };
  reader.readAsText(file);
};