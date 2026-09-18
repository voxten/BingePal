"use client";

import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FiDownload, FiAlertCircle } from 'react-icons/fi';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Poster from './ui/Poster';
import { Field, Input } from './ui/Field';

const AddSeriesModal = ({ isOpen, onClose, userId }) => {
    const [imdbInput, setImdbInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState('');

    // Dodano imdbId, tvmazeId oraz watchedEpisodesList do stanu
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        seasons: 1,
        totalEpisodes: 0,
        watchedEpisodes: 0,
        watchedEpisodesList: [], // Tu będziemy trzymać ID obejrzanych odcinków
        status: 'plan-to-watch',
        rating: 0,
        imdbId: '',
        tvmazeId: ''
    });

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
                    throw new Error('Series not found in open databases.');
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

            // Autofill the modal input state elements
            setFormData(prev => ({
                ...prev,
                title: showData.name || '',
                imageUrl: showData.image?.original || showData.image?.medium || '',
                seasons: parseInt(seasonsCount) || 1,
                totalEpisodes: parseInt(totalEpisodes) || 0,
                imdbId: imdbId,
                tvmazeId: showId,
                watchedEpisodesList: [], // Reset przy nowym imporcie
                watchedEpisodes: 0
            }));

            setImdbInput('');
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return;
        setIsSaving(true);

        try {
            const tvmazeIdStr = formData.tvmazeId ? formData.tvmazeId.toString().trim() : '';
            const imdbIdStr = formData.imdbId ? formData.imdbId.toString().trim() : '';

            let canonicalSeriesId = '';
            if (tvmazeIdStr) {
                canonicalSeriesId = `tv_${tvmazeIdStr}`;
            } else if (imdbIdStr) {
                canonicalSeriesId = `imdb_${imdbIdStr}`;
            } else {
                canonicalSeriesId = doc(collection(db, 'series')).id;
            }

            // 1. Save / update global catalog in 'series'
            const catalogData = {
                title: formData.title.trim(),
                imageUrl: formData.imageUrl || '',
                imdbId: imdbIdStr || '',
                tvmazeId: tvmazeIdStr || '',
                totalEpisodes: parseInt(formData.totalEpisodes) || 0,
                seasons: parseInt(formData.seasons) || 1,
                updatedAt: Date.now()
            };
            await setDoc(doc(db, 'series', canonicalSeriesId), catalogData, { merge: true });

            // 2. Save user tracking record in 'userSeries'
            const userSeriesDocId = `${userId}_${canonicalSeriesId}`;
            const userSeriesData = {
                userId: userId,
                seriesId: canonicalSeriesId,
                status: formData.status || 'plan-to-watch',
                rating: parseInt(formData.rating) || 0,
                watchedEpisodes: parseInt(formData.watchedEpisodes) || 0,
                watchedEpisodesList: formData.watchedEpisodesList || [],
                updatedAt: Date.now()
            };
            await setDoc(doc(db, 'userSeries', userSeriesDocId), userSeriesData, { merge: true });

            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add series"
            description="Import details from IMDb or fill them in yourself."
            footer={
                <>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={!formData.title.trim()}
                    >
                        Save series
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <Field
                    label="Import from IMDb"
                    hint="Paste a link like imdb.com/title/tt0903747 or just the ID."
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
                            placeholder="IMDb link or ID"
                            value={imdbInput}
                            onChange={(e) => setImdbInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetchImdbData()}
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

                <div className="space-y-4">
                    <Field label="Title">
                        <Input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Seasons">
                            <Input
                                type="number"
                                value={formData.seasons}
                                onChange={(e) => setFormData({...formData, seasons: parseInt(e.target.value) || 0})}
                                min="1"
                            />
                        </Field>
                        <Field label="Total episodes">
                            <Input
                                type="number"
                                value={formData.totalEpisodes}
                                onChange={(e) => setFormData({...formData, totalEpisodes: parseInt(e.target.value) || 0})}
                                min="0"
                            />
                        </Field>
                    </div>

                    <Field label="Poster image URL">
                        <div className="flex gap-3 items-center">
                            {formData.imageUrl && (
                                <Poster src={formData.imageUrl} alt="Poster preview" className="w-10 h-[60px] rounded-md shrink-0" />
                            )}
                            <Input
                                type="text"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                                placeholder="https://…"
                            />
                        </div>
                    </Field>
                </div>
            </div>
        </Modal>
    );
};

export default AddSeriesModal;
