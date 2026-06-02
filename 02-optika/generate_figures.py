#!/usr/bin/env python3
"""Generate PNG figures for report.tex."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parent / "figures"
OUT.mkdir(exist_ok=True)

BASE = dict(
    screenDistance=1.0,
    slitWidth=20e-6,
    period=100e-6,
    wavelengthNm=550.0,
    bandwidthNm=0.0,
    slits=5,
    screenHalfWidth=0.03,
)


def sinc_sq(x):
    x = np.asarray(x)
    out = np.ones_like(x, dtype=float)
    mask = np.abs(x) >= 1e-12
    s = np.sin(x[mask]) / x[mask]
    out[mask] = s * s
    return out


def intensity(y, params):
    L = params["screenDistance"]
    a = params["slitWidth"]
    d = params["period"]
    lam = params["wavelengthNm"] * 1e-9
    n = int(params["slits"])
    sin_t = y / np.sqrt(y * y + L * L)
    beta = np.pi * a * sin_t / lam
    gamma = np.pi * d * sin_t / lam
    single = sinc_sq(beta)
    if n <= 1:
        return single
    denom = n * np.sin(gamma)
    multi = np.where(np.abs(denom) < 1e-12, 1.0, (np.sin(n * gamma) / denom) ** 2)
    return single * multi


def profile(params, n=640):
    hw = params["screenHalfWidth"]
    ys = np.linspace(-hw, hw, n)
    vals = intensity(ys, params)
    if vals.max():
        vals /= vals.max()
    return ys, vals


def wavelength_to_rgb(wl):
    wl = np.clip(wl, 380, 780)
    r = g = b = 0.0
    if wl < 440:
        r, b = -(wl - 440) / 60, 1.0
    elif wl < 490:
        g, b = (wl - 440) / 50, 1.0
    elif wl < 510:
        g, b = 1.0, -(wl - 510) / 20
    elif wl < 580:
        r, g = (wl - 510) / 70, 1.0
    elif wl < 645:
        r, g = 1.0, -(wl - 645) / 65
    else:
        r = 1.0
    if wl < 420:
        f = 0.3 + 0.7 * (wl - 380) / 40
    elif wl > 700:
        f = 0.3 + 0.7 * (780 - wl) / 80
    else:
        f = 1.0
    return np.array([max(r, 0), max(g, 0), max(b, 0)]) * f


def main():
    ys, vals = profile(BASE)
    ys_mm = ys * 1e3

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(ys_mm, vals)
    ax.set_xlabel("y, мм")
    ax.set_ylabel("I / I(0)")
    ax.set_title(r"Монохроматическая интерференция ($N=5$, $\lambda=550$ нм)")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "slit_interference_profile_mono.png", dpi=160)
    plt.close(fig)

    p = {**BASE, "bandwidthNm": 40.0}
    ys, _ = profile(p)
    ys_mm = ys * 1e3
    rgb = np.array([wavelength_to_rgb(550 + 20 * np.sin(2 * np.pi * i / len(ys))) for i in range(len(ys))])
    rgb = rgb.reshape(1, -1, 3)

    fig, axes = plt.subplots(2, 1, figsize=(10, 4), gridspec_kw={"height_ratios": [2, 1]})
    ys2, vals2 = profile(p)
    axes[0].plot(ys_mm, vals2)
    axes[0].set_ylabel("I / I(0)")
    axes[0].grid(True, alpha=0.3)
    axes[1].imshow(rgb, aspect="auto", extent=[ys_mm[0], ys_mm[-1], 0, 1])
    axes[1].set_xlabel("y, мм")
    axes[1].set_yticks([])
    axes[1].set_title("Цветное распределение (квазимонохроматический свет)")
    fig.tight_layout()
    fig.savefig(OUT / "slit_interference_color.png", dpi=160)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 4))
    for n, ls in [(1, "-"), (3, "--"), (5, "-."), (10, ":")]:
        ys, vals = profile({**BASE, "slits": n})
        ax.plot(ys * 1e3, vals, ls=ls, label=f"N={n}")
    ax.set_xlabel("y, мм")
    ax.set_ylabel("I / I(0)")
    ax.set_title("Влияние числа щелей на ширину максимумов")
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "slit_interference_N_variation.png", dpi=160)
    plt.close(fig)

    print(f"Saved figures to {OUT}")


if __name__ == "__main__":
    main()
