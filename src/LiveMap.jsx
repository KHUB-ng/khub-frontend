import React from 'react';
import styles from './LiveMap.module.css';

export default function LiveMap({ latitude, longitude, query, origin, destination, label = 'Map location' }) {
  const hasRoute = origin && destination && Number.isFinite(Number(origin.lat)) && Number.isFinite(Number(origin.lng)) && Number.isFinite(Number(destination.lat)) && Number.isFinite(Number(destination.lng));
  const hasPoint = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && latitude !== '' && longitude !== '';
  const search = String(query || '').trim();
  if (!hasRoute && !hasPoint && !search) return <div className={styles.empty}>Map preview appears when location details are available.</div>;
  const src = hasRoute
    ? `https://maps.google.com/maps?saddr=${encodeURIComponent(`${origin.lat},${origin.lng}`)}&daddr=${encodeURIComponent(`${destination.lat},${destination.lng}`)}&output=embed`
    : hasPoint
      ? `https://maps.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=15&output=embed`
      : `https://maps.google.com/maps?q=${encodeURIComponent(search)}&z=13&output=embed`;
  return <div className={styles.frame}><iframe title={label} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>;
}
