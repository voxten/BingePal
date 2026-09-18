"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FiDownload, FiAlertCircle } from 'react-icons/fi';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Poster from './ui/Poster';
import RatingStars from './ui/RatingStars';
import { STATUS_OPTIONS } from './ui/StatusBadge';
import { Field, Input, Select } from './ui/Field';

const EditSeriesModal = ({ series, onClose }) => {
    const [imdbInput, setImdbInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        seasons: 1,
        totalEpisodes: 1,
        watchedEpisodes: 0,
        status: 'plan-to-watch',
        rating: 0,
        imdbId: '',
        tvmazeId: ''
    });

    useEffect(() => {
        if (series) {
            setFormData({
                title: series.title || '',
                imageUrl: series.imageUrl || '',
                seasons: series.seasons || 1,
                totalEpisodes: series.totalEpisodes || 1,
                watchedEpisodes: series.watchedEpisodes || 0,
                status: series.status || 'plan-to-watch',
                rating: series.rating || 0,
                imdbId: series.imdbId || '',
                tvmazeId: series.tvmazeId || ''
            });
            setImdbInput(series.imdbId || '');
        }
    }, [series]);

    const handleFetchImdbData = async () => {
        if (!imdbInput.trim()) return;

        setIsFetching(true);
        setFetchError('');

        try {
            const match = imdbInput.trim().match(/tt\d+/);
            if (!match) {
                throw new Error('Invalid IMDb ID or URL format');
            }
            const imdbId = match[0];

            const lookupResponse = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`, {
                headers: { 'Accept': 'application/json' }
            });

            if (!lookupResponse.ok) {
                if (lookupResponse.status === 404) {
                    throw new Error('Series not found in databases.');
                }
                throw new Error('Metadata server rejected request.');
            }

            const showData = await lookupResponse.json();
            const showId = showData.id;

            const episodesResponse = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
            let seasonsCount = 1;
            let totalEpisodes = 0;

            if (episodesResponse.ok) {
                const episodes = await episodesResponse.json();
                totalEpisodes = episodes.length;

                const seasonNumbers = episodes.map(ep => ep.season).filter(Boolean);
                if (seasonNumbers.length > 0) {
                    seasonsCount = Math.max(...seasonNumbers);
                }
            }

            setFormData(prev => {
                const safeWatchedEpisodes = prev.watchedEpisodes > totalEpisodes ? totalEpisodes : prev.watchedEpisodes;

                return {
                    ...prev,
                    title: showData.name || prev.title,
                    imageUrl: showData.image?.original || showData.image?.medium || prev.imageUrl,
                    seasons: parseInt(seasonsCount) || prev.seasons,
                    totalEpisodes: parseInt(totalEpisodes) || prev.totalEpisodes,
                    watchedEpisodes: safeWatchedEpisodes,
                    imdbId: imdbId,
                    tvmazeId: showId
                };
            });

        } catch (err) {
            setFetchError(err.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const seriesDocId = series.seriesId || series.id;
            const userSeriesDocId = series.userSeriesId || series.id;

            // 1. Update shared catalog document in 'series'
            const catalogData = {
                title: formData.title,
                imageUrl: formData.imageUrl,
                seasons: formData.seasons,
                totalEpisodes: formData.totalEpisodes,
                imdbId: formData.imdbId || '',
                tvmazeId: formData.tvmazeId ? formData.tvmazeId.toString() : '',
                updatedAt: Date.now()
            };
            if (seriesDocId) {
                await setDoc(doc(db, 'series', seriesDocId), catalogData, { merge: true });
            }

            // 2. Update user's tracking state in 'userSeries'
            const userSeriesData = {
                status: formData.status,
                rating: formData.rating,
                watchedEpisodes: formData.watchedEpisodes,
                updatedAt: Date.now()
            };
            if (userSeriesDocId) {
                await updateDoc(doc(db, 'userSeries', userSeriesDocId), userSeriesData);
            }

            onClose();
        } catch (error) {
            console.error('Error updating document: ', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'seasons' || name === 'totalEpisodes' || name === 'watchedEpisodes'
                ? parseInt(value) || 0
                : value
        }));
    };

    if (!series) return null;

    return (
        <Modal
            onClose={onClose}
            title="Edit series"
            description={series.title}
            footer={
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit" form="edit-form" loading={isSaving}>
                        Save changes
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <Field
                    label="Refresh from IMDb"
                    hint="Updates the poster, title and episode counts. Your progress and rating stay the same."
                    error={fetchError && (
                        <span className="inline-flex items-center gap-1.5">
                            <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {fetchError}
                        </span>
                    )}
                >
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="IMDb link or ID (e.g. tt0903747)"
                            value={imdbInput}
                            onChange={(e) => setImdbInput(e.target.value)}
                            disabled={isFetching}
                        />
                        <Button
                            icon={FiDownload}
                            onClick={handleFetchImdbData}
                            loading={isFetching}
                            disabled={!imdbInput}
                        >
                            Fetch
                        </Button>
                    </div>
                </Field>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Title">
                        <Input type="text" name="title" value={formData.title} onChange={handleChange} required />
                    </Field>

                    <Field label="Poster image URL">
                        <div className="flex gap-3 items-center">
                            {formData.imageUrl && (
                                <Poster src={formData.imageUrl} alt="Poster preview" className="w-10 h-[60px] rounded-md shrink-0" />
                            )}
                            <Input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://…" />
                        </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Seasons">
                            <Input type="number" name="seasons" value={formData.seasons} onChange={handleChange} min="1" />
                        </Field>
                        <Field label="Total episodes">
                            <Input type="number" name="totalEpisodes" value={formData.totalEpisodes} onChange={handleChange} min="1" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Watched episodes">
                            <Input
                                type="number"
                                name="watchedEpisodes"
                                value={formData.watchedEpisodes}
                                onChange={handleChange}
                                min="0"
                                max={formData.totalEpisodes}
                            />
                        </Field>
                        <Field label="Status">
                            <Select name="status" value={formData.status} onChange={handleChange}>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </Field>
                    </div>

                    <Field label="Rating">
                        <RatingStars
                            rating={formData.rating}
                            size="lg"
                            onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
                        />
                    </Field>
                </form>
            </div>
        </Modal>
    );
};

export default EditSeriesModal;
