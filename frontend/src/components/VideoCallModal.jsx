import React, { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import './VideoCallModal.css';

const VideoCallModal = () => {
    const { socket, incomingCall, callAccepted, callEnded, callerSignal, setCallAccepted, resetCallState } = useSocketStore();
    const { authUser } = useAuthStore();
    const { selectedUser } = useChatStore();

    const [stream, setStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerName, setCallerName] = useState("");
    const [isCalling, setIsCalling] = useState(false);

    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);

    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const connectionRef = useRef(null);

    // Start or stop local stream
    useEffect(() => {
        if (incomingCall || isCalling) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            }).catch(err => console.error("Failed to get local stream", err));
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [incomingCall, isCalling]);

    useEffect(() => {
        if (incomingCall && !callAccepted) {
            setReceivingCall(true);
            setCaller(incomingCall.from);
            setCallerName(incomingCall.name);
        }
    }, [incomingCall, callAccepted]);

    // Native WebRTC implementation
    const callUser = (id) => {
        setIsCalling(true);
        const peer = new window.RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

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

        peer.createOffer().then(offer => peer.setLocalDescription(offer)).then(() => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: peer.localDescription,
                from: authUser._id,
                name: authUser.fullName
            });
        });

        socket.on("callAccepted", (signal) => {
            setCallAccepted(true);
            peer.setRemoteDescription(new RTCSessionDescription(signal));
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        setReceivingCall(false);

        const peer = new window.RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

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

        peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal)).then(() => peer.createAnswer()).then(answer => peer.setLocalDescription(answer)).then(() => {
            socket.emit("answerCall", { signal: peer.localDescription, to: caller });
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        socket.emit("endCall", { to: isCalling ? selectedUser?._id : caller });
        if (connectionRef.current) connectionRef.current.close();
        resetCallState();
        setStream(null);
        setIsCalling(false);
        setReceivingCall(false);
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    // Expose start call globally 
    useEffect(() => {
        const handleStartNativeCall = (e) => {
            if (e.detail?.id) callUser(e.detail.id);
        };
        window.addEventListener('start-video-call', handleStartNativeCall);
        return () => window.removeEventListener('start-video-call', handleStartNativeCall);
    }, [stream]); // need stream initialized, so we wait or logic needs to initialize stream first

    if (!incomingCall && !isCalling && !callAccepted) return null;

    return (
        <div className="video-modal-overlay">
            <div className="video-modal animate-fade-in">
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
