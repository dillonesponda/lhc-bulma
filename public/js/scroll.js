$("#scroll-button, #services-link").click(function () {
    $('html, body').animate({
        scrollTop: $("#slideshow").offset().top
    }, 1400);
});