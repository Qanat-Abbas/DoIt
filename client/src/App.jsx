import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck2, Notebook, Mail } from "lucide-react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StepIndicator from "./components/StepIndicator";
import RecordPanel from "./components/RecordPanel";
import LoadingState from "./components/LoadingState";
import TranscriptPanel from "./components/TranscriptPanel";
import TaskList from "./components/TaskList";
import { useRecorder } from "./hooks/useRecorder";
import { transcribeAudio, extractTasks, fetchCachedSample, fetchSampleAudioBlob } from "./lib/api";

// capture -> transcribing -> transcript -> extracting -> results
const STAGE_INDEX = {
  capture: 0,
  transcribing: 1,
  transcript: 1,
  extracting: 2,
  results: 3,
};

export default function App() {
  const [stage, setStage] = useState("capture");
  const [transcript, setTranscript] = useState("");
  const [tasks, setTasks] = useState([]);
  const [checked, setChecked] = useState({});
  const [usedFallback, setUsedFallback] = useState(false);

  const recorder = useRecorder();

  const reset = useCallback(() => {
    setStage("capture");
    setTranscript("");
    setTasks([]);
    setChecked({});
    setUsedFallback(false);
  }, []);

  const runPipeline = useCallback(async (blob) => {
    setUsedFallback(false);
    setStage("transcribing");

    let liveTranscript = null;
    try {
      liveTranscript = await transcribeAudio(blob);
    } catch (err) {
      console.warn("Transcription failed, falling back to cached demo data:", err.message);
    }

    if (!liveTranscript) {
      // FR-9: never show an error — fall back to a cached transcript + task set
      try {
        const cached = await fetchCachedSample();
        setTranscript(cached.transcript);
        setUsedFallback(true);
        setStage("transcript");
        await new Promise((r) => setTimeout(r, 700));
        setStage("extracting");
        setTasks(cached.tasks);
        setChecked({});
        setStage("results");
        return;
      } catch (err) {
        console.error("Cached fallback also failed:", err);
        setTranscript("(Could not transcribe audio right now.)");
        setStage("results");
        return;
      }
    }

    setTranscript(liveTranscript);
    setStage("transcript");
    await new Promise((r) => setTimeout(r, 500)); // let the transcript breathe on screen (FR-4)

    setStage("extracting");
    try {
      const liveTasks = await extractTasks(liveTranscript);
      setTasks(liveTasks);
      setChecked({});
      setStage("results");
    } catch (err) {
      console.warn("Extraction failed, falling back to cached demo tasks:", err.message);
      try {
        const cached = await fetchCachedSample();
        setTasks(cached.tasks);
        setUsedFallback(true);
      } catch {
        setTasks([]);
      }
      setChecked({});
      setStage("results");
    }
  }, []);

  const handleStart = () => recorder.start();

  const handleStop = async () => {
    const blob = await recorder.stop();
    if (blob) runPipeline(blob);
  };

  const handleTrySample = async () => {
    try {
      const blob = await fetchSampleAudioBlob();
      runPipeline(blob);
    } catch (err) {
      console.warn("Sample audio unavailable, using cached response directly:", err.message);
      try {
        const cached = await fetchCachedSample();
        setUsedFallback(true);
        setTranscript(cached.transcript);
        setStage("transcript");
        await new Promise((r) => setTimeout(r, 500));
        setStage("extracting");
        setTasks(cached.tasks);
        setChecked({});
        setStage("results");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUploadFile = (file) => runPipeline(file);

  const toggleTask = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));

  const isCapture = stage === "capture";
  const showTranscript = stage === "transcript" || stage === "extracting" || stage === "results";
  const showResults = stage === "results";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 py-8 sm:px-10">
        <AnimatePresence mode="wait">
          {isCapture ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-1 flex-col items-center justify-center gap-10 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300">
                  Voice-to-tasks, in seconds
                </span>
                <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                  Say it once.
                  <br />
                  We'll make sure it gets done.
                </h1>
                <p className="max-w-sm text-[15px] text-white/50">
                  Talk through your meeting, lecture, or brainstorm at your own pace. DoIt!
                  listens for the commitments and turns them into a checklist with owners and
                  deadlines attached.
                </p>
              </div>

              <RecordPanel
                isRecording={recorder.isRecording}
                seconds={recorder.seconds}
                level={recorder.level}
                micError={recorder.error}
                onStart={handleStart}
                onStop={handleStop}
                onTrySample={handleTrySample}
                onUploadFile={handleUploadFile}
                disabled={false}
              />

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-medium text-emerald-300">
                  <CalendarCheck2 className="h-3 w-3" />
                  Push to Google Calendar
                </span>
                <span className="text-white/20">·</span>
                <span className="text-white/30">Coming soon:</span>
                <RoadmapChip icon={<Notebook className="h-3 w-3" />} label="Notion push" />
                <RoadmapChip icon={<Mail className="h-3 w-3" />} label="Daily digest" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-1 flex-col gap-8 pt-4"
            >
              <StepIndicator currentIndex={STAGE_INDEX[stage]} />

              {stage === "transcribing" && <LoadingState label="Transcribing your recording..." />}

              {showTranscript && transcript && (
                <TranscriptPanel transcript={transcript} isCached={usedFallback} />
              )}

              {stage === "extracting" && (
                <LoadingState label="Extracting action items..." />
              )}

              {showResults && (
                <TaskList
                  tasks={tasks}
                  checked={checked}
                  onToggle={toggleTask}
                  onReset={reset}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function RoadmapChip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
      {icon}
      {label}
    </span>
  );
}
