"use client";

import { useState, useEffect } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { getUpcomingSchedule, groupByAirWindow } from '../../services/airingScheduleService';
import StreamingBadge from '../ui/StreamingBadge';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import EmptyState from '../ui/EmptyState';
import MediaCard from '../series/MediaCard';
import ScheduleRow from '../schedule/ScheduleRow';

function ScheduleSkeleton() {
    return (
        <Card padding="none" className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                    <div className="w-10 h-[60px] rounded-md bg-slate-200 dark:bg-slate-800" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                    </div>
                    <div className="hidden sm:block h-3.5 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
            ))}
        </Card>
    );
}

export default function AiringScheduleView({ allSeries = [], filterStatus = 'all', onOpenTracker }) {
    const [loading, setLoading] = useState(true);
    const [scheduleData, setScheduleData] = useState({
        upcoming: [],
        ongoingNoDate: [],
        ended: []
    });

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        getUpcomingSchedule(allSeries)
            .then(data => {
                if (!isMounted) return;
                setScheduleData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching airing schedule:', err);
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [allSeries]);

    const matchesFilter = (item) => filterStatus === 'all' || item.userStatus === filterStatus;
    const filteredUpcoming = scheduleData.upcoming.filter(matchesFilter);
    const filteredOngoing = scheduleData.ongoingNoDate.filter(matchesFilter);
    const upcomingGroups = groupByAirWindow(filteredUpcoming);

    // Open the tracker with the full series record (the schedule item lacks tvmazeId and watch progress)
    const openTracker = (item) => {
        if (!onOpenTracker) return;
        const source = allSeries.find(s => s.id === item.userSeriesId || s.seriesId === item.seriesId);
        onOpenTracker(source || { id: item.seriesId, ...item });
    };

    if (loading) {
        return <ScheduleSkeleton />;
    }

    if (filteredUpcoming.length === 0 && filteredOngoing.length === 0) {
        return (
            <EmptyState
                icon={FiCalendar}
                title="Nothing scheduled"
                description="None of these series have announced new episodes. Check back later."
            />
        );
    }

    return (
        <div className="space-y-10">
            {filteredUpcoming.length === 0 ? (
                <Card padding="sm" className="text-sm text-slate-500 dark:text-slate-400">
                    No confirmed air dates yet for these series.
                </Card>
            ) : (
                upcomingGroups.map(group => (
                    <section key={group.key} className="space-y-3">
                        <SectionHeader title={group.label} count={group.items.length} />
                        <Card padding="none" className="overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {group.items.map(item => (
                                <ScheduleRow
                                    key={item.seriesId}
                                    item={item}
                                    showCountdown={group.key !== 'today' && group.key !== 'tomorrow'}
                                    onOpen={() => openTracker(item)}
                                />
                            ))}
                        </Card>
                    </section>
                ))
            )}

            {filteredOngoing.length > 0 && (
                <section className="space-y-3">
                    <SectionHeader
                        title="Returning, date TBA"
                        count={filteredOngoing.length}
                        description="Still running, but the next episode hasn't been dated yet."
                    />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
                        {filteredOngoing.map(item => (
                            <MediaCard
                                key={item.seriesId}
                                size="sm"
                                imageUrl={item.imageUrl}
                                title={item.title}
                                topLeft={<StreamingBadge providerName={item.network} />}
                                onPosterClick={() => openTracker(item)}
                                posterLabel={`Open ${item.title} episodes`}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
