import { createContext, useContext, useState, useEffect } from 'react';

const ImageContext = createContext();

export const useImage = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!image) {
      const images = import.meta.glob('../images/*.{png,jpg,jpeg}', { eager: true, import: 'default' });
      const imageArray = Object.values(images);
      const randomIndex = Math.floor(Math.random() * imageArray.length);
      setImage(imageArray[randomIndex]);
    }
  }, [image]);

  return (
    <ImageContext.Provider value={{ image }}>
      {children}
    </ImageContext.Provider>
  );
};
