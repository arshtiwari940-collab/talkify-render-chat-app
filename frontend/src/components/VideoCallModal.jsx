import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import './VideoCallModal.css';

const VideoCallModal = () => {
    const { socket, incomingCall, callAccepted, setCallAccepted, resetCallState } = useSocketStore();
    const { authUser } = useAuthStore();
    const { selectedUser } = useChatStore();

    const [stream, setStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerName, setCallerName] = useState("");
    const [isCalling, setIsCalling] = useState(false);
    const [callError, setCallError] = useState('');

    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);

    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const connectionRef = useRef(null);
    const streamRef = useRef(null);

    const stopLocalStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setStream(null);
    }, []);

    const ensureLocalStream = useCallback(async () => {
        if (streamRef.current) return streamRef.current;

        const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = currentStream;
        setStream(currentStream);

        if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
        }

        return currentStream;
    }, []);

    useEffect(() => {
        if (incomingCall && !callAccepted) {
            setReceivingCall(true);
            setCaller(incomingCall.from);
            setCallerName(incomingCall.name);
            ensureLocalStream().catch((err) => {
                console.error('Failed to get local stream', err);
                setCallError('Camera or microphone access denied.');
            });
        }
    }, [incomingCall, callAccepted, ensureLocalStream]);

    const callUser = useCallback(async (id) => {
        if (!socket) return;

        try {
            setCallError('');
            setIsCalling(true);
            const localStream = await ensureLocalStream();

            const peer = new window.RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

            peer.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit("callUser", {
                        userToCall: id,
                        signalData: e.candidate,
                        from: authUser._id,
                        name: authUser.fullName
                    });
                }
            };

            peer.ontrack = (e) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = e.streams[0];
                }
            };

            const handleCallAccepted = (signal) => {
                setCallAccepted(true);
                peer.setRemoteDescription(new RTCSessionDescription(signal));
            };

            socket.once("callAccepted", handleCallAccepted);

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("callUser", {
                userToCall: id,
                signalData: peer.localDescription,
                from: authUser._id,
                name: authUser.fullName
            });

            connectionRef.current = peer;
        } catch (err) {
            console.error('Failed to start call', err);
            setCallError('Could not start the video call. Check camera/mic permissions.');
            setIsCalling(false);
            stopLocalStream();
        }
    }, [socket, authUser, ensureLocalStream, setCallAccepted, stopLocalStream]);

    const answerCall = async () => {
        if (!socket || !incomingCall) return;

        try {
            setCallError('');
            setCallAccepted(true);
            setReceivingCall(false);

            const localStream = await ensureLocalStream();

            const peer = new window.RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

            peer.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit("answerCall", { signal: e.candidate, to: caller });
                }
            };

            peer.ontrack = (e) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = e.streams[0];
                }
            };

            await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("answerCall", { signal: peer.localDescription, to: caller });

            connectionRef.current = peer;
        } catch (err) {
            console.error('Failed to answer call', err);
            setCallError('Could not answer the call.');
            resetCallState();
            setReceivingCall(false);
            stopLocalStream();
        }
    };

    const leaveCall = () => {
        if (socket) {
            socket.emit("endCall", { to: isCalling ? selectedUser?._id : caller });
        }
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
        resetCallState();
        stopLocalStream();
        setIsCalling(false);
        setReceivingCall(false);
        setCallError('');
    };

    const toggleVideo = () => {
        const activeStream = streamRef.current;
        if (activeStream) {
            const videoTrack = activeStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        const activeStream = streamRef.current;
        if (activeStream) {
            const audioTrack = activeStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    useEffect(() => {
        const handleStartNativeCall = (e) => {
            if (e.detail?.id) callUser(e.detail.id);
        };
        window.addEventListener('start-video-call', handleStartNativeCall);
        return () => window.removeEventListener('start-video-call', handleStartNativeCall);
    }, [callUser]);

    useEffect(() => {
        return () => stopLocalStream();
    }, [stopLocalStream]);

    if (!incomingCall && !isCalling && !callAccepted) return null;

    return (
        <div className="video-modal-overlay">
            <div className="video-modal animate-fade-in">
                {callError && <div className="call-error">{callError}</div>}

                {receivingCall && !callAccepted ? (
                    <div className="incoming-call-ui">
                        <div className="caller-info">
                            <h2>{callerName} is calling...</h2>
                            <div className="call-actions">
                                <button className="btn btn-accept" onClick={answerCall}>
                                    <Phone className="icon" /> Answer
                                </button>
                                <button className="btn btn-reject" onClick={leaveCall}>
                                    <PhoneOff className="icon" /> Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="active-call-ui">
                        <div className="video-streams">
                            <div className="local-video-container">
                                <video playsInline muted ref={myVideo} autoPlay className="local-video" />
                                <div className="label">You</div>
                            </div>

                            {callAccepted && (
                                <div className="remote-video-container">
                                    <video playsInline ref={userVideo} autoPlay className="remote-video" />
                                    <div className="label">{isCalling ? selectedUser?.fullName : callerName}</div>
                                </div>
                            )}

                            {!callAccepted && isCalling && (
                                <div className="calling-indicator">
                                    <div className="spinner"></div>
                                    <p>Calling {selectedUser?.fullName}...</p>
                                </div>
                            )}
                        </div>

                        <div className="call-controls">
                            <button className={`control-btn ${isAudioMuted ? 'muted' : ''}`} onClick={toggleAudio}>
                                {isAudioMuted ? <MicOff /> : <Mic />}
                            </button>
                            <button className={`control-btn ${isVideoMuted ? 'muted' : ''}`} onClick={toggleVideo}>
                                {isVideoMuted ? <VideoOff /> : <Video />}
                            </button>
                            <button className="control-btn end-call" onClick={leaveCall}>
                                <PhoneOff />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCallModal;
