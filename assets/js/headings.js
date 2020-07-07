function addHeadingLinks() {
    const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6');
    for (let heading of [...headings]) {
        heading.setAttribute('id', heading.innerText.toLowerCase().replace(/ /g, '-').replace(/[^-a-z0-9]/g, ''));
    }
}

document.addEventListener("DOMContentLoaded", addHeadingLinks);