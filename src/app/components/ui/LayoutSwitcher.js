"use client";

import { FiSquare, FiGrid } from 'react-icons/fi';
import SegmentedControl from './SegmentedControl';

const LAYOUT_OPTIONS = [
    { value: 'vertical', label: 'Poster', icon: FiSquare, title: 'Poster view (2:3)' },
    { value: 'wide', label: 'Wide', icon: FiGrid, title: 'Wide view (landscape)' },
];

export default function LayoutSwitcher({ cardLayout, setCardLayout, className = '' }) {
    return (
        <SegmentedControl
            aria-label="Card layout"
            options={LAYOUT_OPTIONS}
            value={cardLayout}
            onChange={setCardLayout}
            className={className}
        />
    );
}
