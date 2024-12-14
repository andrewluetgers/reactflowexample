import { NextResponse } from 'next/server';
import { RunStorage } from '../../storage';

export async function DELETE(request, { params }) {
    const { runId } = await params;

    const run = RunStorage.getRun(runId);
    if (!run) {
        return NextResponse.json(
            { error: "Run not found" },
            { status: 404 }
        );
    }

    // Delete the run from storage
    RunStorage.deleteRun(runId);

    return NextResponse.json({ success: true });
}