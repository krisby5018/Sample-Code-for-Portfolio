// theme-switch.js
document.addEventListener("DOMContentLoaded", function () {
	const switchButtons = document.querySelectorAll(".switch-theme");
	const themeLink = document.getElementById("theme-style");

	if (!switchButtons.length || !themeLink) {
		console.error("Missing theme link or switch buttons");
		return;
	}

	const themes = {
		light: "rainbowsandsparkles.css",
		dark: "darkrainbows.css"
	};

	const savedTheme = localStorage.getItem("selectedTheme");
	if (savedTheme && Object.values(themes).includes(savedTheme)) {
		themeLink.setAttribute("href", savedTheme);
	} else {
		// light theme default
		themeLink.setAttribute("href", themes.light);
		localStorage.setItem("selectedTheme", themes.light);
	}

	switchButtons.forEach(button => {
		button.addEventListener("click", function (event) {
			event.preventDefault();

			const currentTheme = themeLink.getAttribute("href");
			const newTheme = currentTheme.endsWith(themes.light)
				? themes.dark
				: themes.light;

			themeLink.setAttribute("href", newTheme);
			localStorage.setItem("selectedTheme", newTheme);
		});
	});
});

// gallery-random.js
(() => {
			  const galleryContainer = document.getElementById("gallery-list");
			  const prevBtn = document.getElementById("prev-btn");
			  const nextBtn = document.getElementById("next-btn");
			  const pageInfo = document.getElementById("page-info");
			  const searchInput = document.getElementById("search-bar");
			  const searchBtn = document.getElementById("search-btn");
			  const randomBtn = document.getElementById("random-btn");

			  let galleryData = [];
			  let filteredData = [];
			  let originalFilteredData = [];
			  let currentPage = 1;
			  const itemsPerPage = 12;
			  let isRandom = false;

			  // Parse URL params
			  const params = new URLSearchParams(window.location.search);
			  const tag = params.get("tag") || null;
			  const pageParam = parseInt(params.get("page")) || 1;
			  const randomParam = params.get("random") === "1"; // remember random state
			  const searchParam = params.get("search") || "";

			  // Fetch JSON
			  fetch("/js/gallery.json")
			    .then(res => res.json())
			    .then(data => {
			      galleryData = data.reverse(); // newest first

			      // Apply tag filter
			      if (tag) {
			        filteredData = galleryData.filter(item =>
			          item.tags && item.tags.some(t => t.toLowerCase() === tag.toLowerCase())
			        );
			      } else {
			        filteredData = [...galleryData];
			      }

			      // Apply search filter if exists in URL
			      if (searchParam) {
			        searchInput.value = searchParam;
			        filteredData = filteredData.filter(item =>
			          item.title.toLowerCase().includes(searchParam.toLowerCase()) ||
			          item.alt.toLowerCase().includes(searchParam.toLowerCase()) ||
			          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchParam.toLowerCase())))
			        );
			      }

			      // Save original filtered order
			      originalFilteredData = [...filteredData];

			      // Handle random from URL & sessionStorage
			      if (randomParam) {
			        isRandom = true;
			        randomBtn.textContent = "Random";

			        const stored = sessionStorage.getItem("randomGallery");
			        if (stored) {
			          const order = JSON.parse(stored);
			          filteredData = order.map(i => filteredData[i]).filter(Boolean);
			        } else {
			          filteredData = shuffleArray([...filteredData]);
			          const order = filteredData.map(item => galleryData.indexOf(item));
			          sessionStorage.setItem("randomGallery", JSON.stringify(order));
			        }
			      }

			      // Set current page
			      currentPage = pageParam;
			      renderGallery();
			      updatePagination();
			    })
			    .catch(err => console.error("Failed to load gallery JSON:", err));

			  // Render current page
			  function renderGallery() {
			    galleryContainer.innerHTML = "";
			    const start = (currentPage - 1) * itemsPerPage;
			    const end = start + itemsPerPage;
			    const pageItems = filteredData.slice(start, end);

			    pageItems.forEach(item => {
			      const li = document.createElement("li");
			      li.classList.add("gal-thumbs");
			      li.innerHTML = `<a href="${item.link}" title="${item.title}">
			                        <img src="${item.src}" alt="${item.alt}">
			                      </a>`;
			      galleryContainer.appendChild(li);
			    });
			  }

			  // Update pagination & URL
			  function updatePagination() {
			    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
			    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
			    prevBtn.style.display = (currentPage === 1) ? "none" : "inline-block";
				nextBtn.style.display = (currentPage === totalPages) ? "none" : "inline-block";

			    const newParams = new URLSearchParams();
			    if (tag) newParams.set("tag", tag);
			    if (searchInput.value) newParams.set("search", searchInput.value);
			    if (isRandom) newParams.set("random", "1");
			    newParams.set("page", currentPage);
			    history.replaceState(null, "", `?${newParams.toString()}`);
			  }

			  // Pagination buttons
			  prevBtn.addEventListener("click", () => {
			    if (currentPage > 1) { currentPage--; renderGallery(); updatePagination(); }
			  });
			  nextBtn.addEventListener("click", () => {
			    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
			    if (currentPage < totalPages) { currentPage++; renderGallery(); updatePagination(); }
			  });

			  // Search
			  function performSearch() {
			    const query = searchInput.value.toLowerCase().trim();
			    filteredData = galleryData.filter(item =>
			      item.title.toLowerCase().includes(query) ||
			      item.alt.toLowerCase().includes(query) ||
			      (item.tags && item.tags.some(t => t.toLowerCase().includes(query)))
			    );
			    originalFilteredData = [...filteredData];
			    currentPage = 1;
			    renderGallery();
			    updatePagination();
			    sessionStorage.removeItem("randomGallery"); // reset random if searching
			    isRandom = false;
			    randomBtn.textContent = "Random";
			  }

			  searchBtn.addEventListener("click", performSearch);
			  searchInput.addEventListener("keydown", e => { if (e.key === "Enter") performSearch(); });

			  // Random toggle
			  function toggleRandom() {
			    isRandom = !isRandom;

			    if (isRandom) {
			      randomBtn.textContent = "Random";
			      filteredData = shuffleArray([...filteredData]);
			      const order = filteredData.map(item => galleryData.indexOf(item));
			      sessionStorage.setItem("randomGallery", JSON.stringify(order));
			    } else {
			      randomBtn.textContent = "Random";
			      filteredData = [...originalFilteredData];
			      sessionStorage.removeItem("randomGallery");
			    }

			    currentPage = 1;
			    renderGallery();
			    updatePagination();
			  }

			  randomBtn.addEventListener("click", toggleRandom);

			  // Shuffle helper
			  function shuffleArray(array) {
			    let currentIndex = array.length, randomIndex, temp;
			    while (currentIndex !== 0) {
			      randomIndex = Math.floor(Math.random() * currentIndex);
			      currentIndex--;
			      temp = array[currentIndex];
			      array[currentIndex] = array[randomIndex];
			      array[randomIndex] = temp;
			    }
			    return array;
			  }
			})();
