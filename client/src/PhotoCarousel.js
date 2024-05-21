// PhotoCarousel.js
import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

const PhotoCarousel = () => {
    return (
        <Carousel showArrows={true} autoPlay={true} infiniteLoop={true} showThumbs={false} width={'100%'} className="photo-carousel">
            <div>
                <img src="http://localhost:4000/uploads/img1.jpeg" alt="Slide 1" />
            </div>
            <div>
                <img src="http://localhost:4000/uploads/img2.jpeg" alt="Slide 2" />
            </div>
            <div>
                <img src="http://localhost:4000/uploads/img3.jpeg" alt="Slide 3" />
            </div>
        </Carousel>
    );
}

export default PhotoCarousel;
