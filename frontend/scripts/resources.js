document.addEventListener('DOMContentLoaded', () => {
  const resourcesData = [
    {
      title: "5-Minute Breathing Exercise",
      description: "Quick stress relief technique perfect between classes.",
      type: "exercise",
      duration: "5 min",
      category: "Beginner",
      icon: "wind"
    },
    {
      title: "Managing Academic Stress",
      description: "A guide to handling pressure and preventing burnout.",
      type: "article",
      duration: "8 min read",
      category: "Intermediate",
      icon: "book-open"
    },
    {
      title: "Sleep Better Tonight",
      description: "Guided meditation for better sleep and reduced anxiety.",
      type: "audio",
      duration: "15 min",
      category: "Beginner",
      icon: "moon"
    },
    {
      title: "Social Anxiety Toolkit",
      description: "Practical strategies for social situations and confidence.",
      type: "article",
      duration: "12 min read",
      category: "Advanced",
      icon: "users"
    },
    {
      title: "Building Resilience",
      description: "Learn to bounce back from setbacks and build mental strength.",
      type: "video",
      duration: "10 min",
      category: "Advanced",
      icon: "shield"
    },
    {
      title: "Progressive Muscle Relaxation",
      description: "A deep relaxation technique to release physical tension.",
      type: "exercise",
      duration: "20 min",
      category: "Intermediate",
      icon: "activity"
    }
  ];

  const grid = document.getElementById('resource-grid');
  const filtersContainer = document.getElementById('resource-filters');
  const searchInput = document.getElementById('resource-search');
  const totalChip = document.getElementById('total-resources-chip');
  const activeFilterLabel = document.getElementById('active-filter-label');

  let activeFilter = 'all';
  let searchQuery = '';

  // Helper to get category badges
  function getCategoryStyle(category) {
    switch (category) {
      case 'Beginner':
        return 'bg-wellness/20 text-wellness';
      case 'Intermediate':
        return 'bg-warning/20 text-warning';
      case 'Advanced':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  function applyFilters() {
    let list = [...resourcesData];

    // type filter
    if (activeFilter !== 'all') {
      list = list.filter(r => r.type === activeFilter);
    }

    // search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    return list;
  }

  function renderCounters() {
    const allCount = resourcesData.length;
    const types = ['exercise', 'article', 'audio', 'video'];

    const allBadge = document.querySelector('[data-count-badge="all"]');
    if (allBadge) allBadge.textContent = allCount;

    types.forEach(t => {
      const count = resourcesData.filter(r => r.type === t).length;
      const badge = document.querySelector(`[data-count-badge="${t}"]`);
      if (badge) badge.textContent = count;
    });

    if (totalChip) {
      totalChip.textContent =
        allCount === 1 ? '1 resource available' : `${allCount} resources available`;
    }
  }

  function renderResources() {
    const filteredResources = applyFilters();
    grid.innerHTML = '';

    if (activeFilterLabel) {
      const filterName =
        activeFilter === 'all'
          ? 'All'
          : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
      const extra = searchQuery ? ` • Search: "${searchQuery}"` : '';
      activeFilterLabel.textContent = `Showing: ${filterName}${extra}`;
    }

    if (filteredResources.length === 0) {
      grid.innerHTML = `
        <div class="lg:col-span-3 flex flex-col items-center justify-center text-center gap-3 bg-card border rounded-2xl p-8">
          <i data-lucide="search-x" class="w-8 h-8 text-muted-foreground"></i>
          <p class="text-md font-medium">No resources match your filters.</p>
          <p class="text-sm text-muted-foreground">
            Try clearing the search or switching to a different category.
          </p>
          <button id="clear-filters-btn" class="btn btn-outline btn-sm mt-2">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            Reset filters
          </button>
        </div>
      `;
      lucide.createIcons();

      const resetBtn = document.getElementById('clear-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          activeFilter = 'all';
          document
            .querySelectorAll('.filter-btn')
            .forEach(btn => btn.classList.remove('active'));
          const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
          if (allBtn) allBtn.classList.add('active');
          renderResources();
        });
      }

      return;
    }

    filteredResources.forEach(resource => {
      const card = document.createElement('div');
      card.className = 'wellness-card resource-card p-0';

      card.innerHTML = `
        <div class="card-content p-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 class="card-title text-lg mb-1">${resource.title}</h3>
              <p class="text-xs text-muted-foreground capitalize">
                ${resource.type}
              </p>
            </div>
            <div class="p-2 rounded-full bg-primary/20 text-primary">
              <i data-lucide="${resource.icon}" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="card-description mb-4">${resource.description}</p>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="resource-tag ${getCategoryStyle(
                resource.category
              )}">${resource.category}</span>
              <span class="text-xs text-muted-foreground">${resource.duration}</span>
            </div>
            <span class="text-xs text-muted-foreground">
              <i data-lucide="clock" class="w-3 h-3 inline-block mr-1"></i>
              Fits in your day
            </span>
          </div>
        </div>
        <div class="card-footer p-4 border-t flex items-center gap-2">
          <button class="btn btn-wellness flex-1">
            <i data-lucide="play-circle" class="w-4 h-4"></i>
            Start Now
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    lucide.createIcons();
  }

  // Filter click handling
  if (filtersContainer) {
    filtersContainer.addEventListener('click', e => {
      const target = e.target.closest('button');
      if (!target) return;
      const filter = target.dataset.filter;
      if (!filter) return;

      activeFilter = filter;
      document
        .querySelectorAll('.filter-btn')
        .forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');

      renderResources();
    });
  }

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value || '';
      renderResources();
    });
  }

  // Initial render
  renderCounters();
  renderResources();
});
