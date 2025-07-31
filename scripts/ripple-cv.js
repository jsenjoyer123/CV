document.addEventListener('DOMContentLoaded', function() {
  const cvContainer = document.querySelector('.cv-container');
  
  if (cvContainer) {
    cvContainer.addEventListener('click', function(event) {
      if (event.target !== event.currentTarget) {
        createRipple(event, event.target);
      }
    });
  }

  // Установка индексов для элементов списка интересов
  const interestItems = document.querySelectorAll('.interests-list li');
  interestItems.forEach((item, index) => {
    item.style.setProperty('--i', index);
  });

  function createRipple(event, targetElement) {
    targetElement.classList.add('ripple-target');

    const circle = document.createElement("span");
    const diameter = Math.max(targetElement.clientWidth, targetElement.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - targetElement.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - targetElement.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = targetElement.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }

    targetElement.appendChild(circle);

    setTimeout(() => {
      targetElement.classList.remove('ripple-target');
    }, 600);
  }
});
