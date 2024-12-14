import { NextResponse } from 'next/server';
import { RunStorage } from '../../storage';

export async function GET(request, { params }) {
    // Await params first, then destructure
    const { runId } = await params;

    const run = RunStorage.getRun(runId);
    if (!run) {
        return NextResponse.json(
            { error: "Run not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(run);
}
