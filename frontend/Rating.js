document.addEventListener("DOMContentLoaded", function () {

  const ratingCards = document.querySelectorAll(".rating-stars");

  ratingCards.forEach(card => {
    const stars = card.querySelectorAll(".star");

    stars.forEach(star => {

      // Hover preview
      star.addEventListener("mouseover", function () {
        const value = this.getAttribute("data-value");
        highlightStars(card, value);
      });

      // Remove preview when mouse leaves
      star.addEventListener("mouseout", function () {
        const savedRating = card.getAttribute("data-rating");
        highlightStars(card, savedRating);
      });

      // Click to set rating
      star.addEventListener("click", function () {
        const value = this.getAttribute("data-value");
        card.setAttribute("data-rating", value);
        highlightStars(card, value);
      });

    });
  });

  function highlightStars(card, rating) {
    const stars = card.querySelectorAll(".star");

    stars.forEach(star => {
      if (star.getAttribute("data-value") <= rating) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }

});