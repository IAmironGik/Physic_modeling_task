#!/usr/bin/env python3
"""Generate PNG figures for report.tex."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

G = 9.81
OUT = Path(__file__).resolve().parent / "figures"
OUT.mkdir(exist_ok=True)

BASE = dict(
    mass=0.5,
    length=1.0,
    springDistance=0.6,
    springStiffness=20.0,
    damping=0.05,
    theta1Initial=0.15,
    theta2Initial=0.0,
    duration=30.0,
    sampleCount=2500,
)


def kappa(params):
    m, L, L1, k = params["mass"], params["length"], params["springDistance"], params["springStiffness"]
    return k * L1 * L1 / (m * L * L)


def normal_freqs(params):
    w0 = np.sqrt(G / params["length"])
    kap = kappa(params)
    return w0, np.sqrt(w0 * w0 + 2 * kap)


def derivatives(state, params):
    t1, w1, t2, w2 = state
    m, L, L1 = params["mass"], params["length"], params["springDistance"]
    k, beta = params["springStiffness"], params["damping"]
    kap = k * L1 * L1 / (m * L * L)
    w0sq = G / L
    gamma = beta / m
    a1 = -w0sq * t1 - kap * (t1 - t2) - gamma * w1
    a2 = -w0sq * t2 - kap * (t2 - t1) - gamma * w2
    return np.array([w1, a1, w2, a2])


def rk4_step(state, dt, params):
    k1 = derivatives(state, params)
    k2 = derivatives(state + 0.5 * dt * k1, params)
    k3 = derivatives(state + 0.5 * dt * k2, params)
    k4 = derivatives(state + dt * k3, params)
    return state + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def simulate(params):
    n = int(params["sampleCount"])
    dt = params["duration"] / n
    state = np.array([
        params["theta1Initial"], 0.0,
        params["theta2Initial"], 0.0,
    ])
    times = np.empty(n + 1)
    theta1 = np.empty(n + 1)
    theta2 = np.empty(n + 1)
    for i in range(n + 1):
        times[i] = i * dt
        theta1[i], theta2[i] = state[0], state[2]
        if i < n:
            state = rk4_step(state, dt, params)
    return times, theta1, theta2


def main():
    times, theta1, theta2 = simulate(BASE)
    wm, wp = normal_freqs(BASE)
    fm, fp = wm / (2 * np.pi), wp / (2 * np.pi)

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(times, theta1, label=r"$\theta_1(t)$")
    ax.plot(times, theta2, label=r"$\theta_2(t)$")
    ax.set_xlabel("t, с")
    ax.set_ylabel(r"$\theta$, рад")
    ax.set_title("Связанные маятники: биения и затухание")
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "coupled_pendulums.png", dpi=160)
    plt.close(fig)

    dt = times[1] - times[0]
    n = len(theta1)
    freqs = np.fft.rfftfreq(n, dt)
    spec = np.abs(np.fft.rfft(theta1 - theta1.mean()))
    spec /= spec.max() if spec.max() else 1

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(freqs, spec)
    ax.axvline(fm, color="C1", ls="--", label=rf"$f_-={fm:.3f}$ Гц")
    ax.axvline(fp, color="C2", ls="--", label=rf"$f_+={fp:.3f}$ Гц")
    ax.set_xlim(0, 2)
    ax.set_xlabel("f, Гц")
    ax.set_ylabel("норм. амплитуда")
    ax.set_title("Спектр БПФ и аналитические частоты")
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "coupled_pendulums_fft_check.png", dpi=160)
    plt.close(fig)

    ks = [5, 20, 50, 100]
    fbeat = []
    for k in ks:
        p = {**BASE, "springStiffness": k}
        wm, wp = normal_freqs(p)
        fbeat.append(abs(wp - wm) / (2 * np.pi))

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(ks, fbeat, "o-")
    ax.set_xlabel("k, Н/м")
    ax.set_ylabel(r"$f_{\mathrm{beat}}$, Гц")
    ax.set_title("Частота биений vs жёсткость пружины")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "coupled_pendulums_k_variation.png", dpi=160)
    plt.close(fig)

    print(f"Saved figures to {OUT}")


if __name__ == "__main__":
    main()
