// BeeAR Snapshot Gallery - saves snapshots in localStorage, works offline
(function () {
  const STORAGE_KEY = "beear_snapshot_gallery";

  function loadSnapshots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveSnapshots(snapshots) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }

  function addSnapshot(dataUrl, label) {
    const snapshots = loadSnapshots();
    snapshots.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      dataUrl,
      label: label || "",
      createdAt: new Date().toISOString(),
    });
    saveSnapshots(snapshots);
    return snapshots;
  }

  function deleteSnapshot(id) {
    const snapshots = loadSnapshots().filter((s) => s.id !== id);
    saveSnapshots(snapshots);
    return snapshots;
  }

  function renderGallery(container) {
    const snapshots = loadSnapshots();
    if (snapshots.length === 0) {
      container.innerHTML =
        '<p class="snapshot-empty">No snapshots yet. Capture one to get started.</p>';
      return;
    }
    container.innerHTML = snapshots
      .map(
        (s) =>
          '<div class="snapshot-card" data-id="' +
          s.id +
          '">' +
          '<img src="' +
          s.dataUrl +
          '" alt="' +
          (s.label || "Snapshot") +
          '" />' +
          (s.label ? '<span class="snapshot-label">' + s.label + "</span>" : "") +
          '<button class="snapshot-delete" data-id="' +
          s.id +
          '">Delete</button>' +
          "</div>"
      )
      .join("");

    container.querySelectorAll(".snapshot-delete").forEach((btn) => {
      btn.addEventListener("click", function () {
        deleteSnapshot(this.dataset.id);
        renderGallery(container);
      });
    });
  }

  window.BeeAR = window.BeeAR || {};
  window.BeeAR.SnapshotGallery = {
    load: loadSnapshots,
    add: addSnapshot,
    delete: deleteSnapshot,
    render: renderGallery,
  };
})();
