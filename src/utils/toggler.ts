export default function toggleElement(
  element: HTMLElement,
  animation: string,
  animation_name: string
) {
  console.log(animation, animation_name);

  element.classList.add(animation);

  element.addEventListener("animationend", e => {
    if (e.animationName === animation_name) {
      element.classList.remove(animation);
      element.style.display = "none";
    }
  });
}
