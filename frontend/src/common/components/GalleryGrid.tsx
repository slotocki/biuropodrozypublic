// components/GalleryGrid.tsx
import React, { useState } from "react";

export interface GalleryPhoto {
    id: number;
    url: string;
    opis?: string;
    czyGlowne?: boolean;
    meta1?: string; // np. nazwa osrodka
    meta2?: string; // np. nazwa destynacji
    sourceType?: "destynacja" | "osrodek";
}

export default function GalleryGrid({
                                        photos,
                                        onPhotoClick,
                                    }: {
    photos: GalleryPhoto[];
    onPhotoClick?: (p: GalleryPhoto, i: number) => void;
}) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {photos.map((photo, i) => (
                <div key={photo.id} style={{ background: "#232a36", borderRadius: 8, overflow: "hidden", cursor: "pointer" }}
                     onClick={() => onPhotoClick?.(photo, i)}>
                    <img src={photo.url} alt={photo.opis || "Zdjêcie"} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                    <div style={{ padding: "8px 12px", color: "#e2e8f0", background: "rgba(0,0,0,0.13)" }}>
                        {photo.opis && <div style={{ fontSize: 14 }}>{photo.opis}</div>}
                        {photo.meta1 && <div style={{ fontSize: 12, color: "#a0aec0" }}>{photo.meta1}</div>}
                        {photo.meta2 && <div style={{ fontSize: 12 }}>{photo.meta2}</div>}
                        {photo.czyGlowne && <span style={{ color: "#ffd700", fontWeight: 700 }}>? G³ówne</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}


