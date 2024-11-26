-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Počítač: 127.0.0.1
-- Vytvořeno: Úte 26. lis 2024, 15:35
-- Verze serveru: 10.4.28-MariaDB
-- Verze PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databáze: `artzone teplice`
--

-- --------------------------------------------------------

--
-- Struktura tabulky `akce`
--

CREATE TABLE `akce` (
  `id` int(11) NOT NULL,
  `nazev` varchar(128) NOT NULL,
  `odKdy` datetime NOT NULL,
  `doKdy` datetime DEFAULT NULL,
  `misto` varchar(128) DEFAULT NULL,
  `podrobnosti` text DEFAULT NULL,
  `pro_koho` varchar(256) DEFAULT NULL,
  `typ_id` int(11) NOT NULL,
  `foto_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `akcefoto`
--

CREATE TABLE `akcefoto` (
  `id` int(11) NOT NULL,
  `nazev` varchar(256) NOT NULL,
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `profilfoto`
--

CREATE TABLE `profilfoto` (
  `id` int(11) NOT NULL,
  `nazev` varchar(256) NOT NULL,
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `role`
--

CREATE TABLE `role` (
  `id` int(11) NOT NULL,
  `nazev` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `typ`
--

CREATE TABLE `typ` (
  `id` int(11) NOT NULL,
  `nazev` varchar(32) NOT NULL,
  `barva` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `uzivatel`
--

CREATE TABLE `uzivatel` (
  `id` int(11) NOT NULL,
  `jmeno` varchar(256) NOT NULL,
  `profilFoto_id` int(11) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `akce_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexy pro exportované tabulky
--

--
-- Indexy pro tabulku `akce`
--
ALTER TABLE `akce`
  ADD PRIMARY KEY (`id`),
  ADD KEY `typ_id` (`typ_id`),
  ADD KEY `foto_id` (`foto_id`);

--
-- Indexy pro tabulku `akcefoto`
--
ALTER TABLE `akcefoto`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `profilfoto`
--
ALTER TABLE `profilfoto`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `typ`
--
ALTER TABLE `typ`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `uzivatel`
--
ALTER TABLE `uzivatel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `profilFoto_id` (`profilFoto_id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `akce_id` (`akce_id`);

--
-- AUTO_INCREMENT pro tabulky
--

--
-- AUTO_INCREMENT pro tabulku `akce`
--
ALTER TABLE `akce`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pro tabulku `akcefoto`
--
ALTER TABLE `akcefoto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pro tabulku `profilfoto`
--
ALTER TABLE `profilfoto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pro tabulku `role`
--
ALTER TABLE `role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pro tabulku `typ`
--
ALTER TABLE `typ`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pro tabulku `uzivatel`
--
ALTER TABLE `uzivatel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Omezení pro exportované tabulky
--

--
-- Omezení pro tabulku `akce`
--
ALTER TABLE `akce`
  ADD CONSTRAINT `akce_ibfk_1` FOREIGN KEY (`typ_id`) REFERENCES `typ` (`id`),
  ADD CONSTRAINT `akce_ibfk_2` FOREIGN KEY (`foto_id`) REFERENCES `akcefoto` (`id`);

--
-- Omezení pro tabulku `uzivatel`
--
ALTER TABLE `uzivatel`
  ADD CONSTRAINT `uzivatel_ibfk_1` FOREIGN KEY (`profilFoto_id`) REFERENCES `profilfoto` (`id`),
  ADD CONSTRAINT `uzivatel_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`),
  ADD CONSTRAINT `uzivatel_ibfk_3` FOREIGN KEY (`akce_id`) REFERENCES `akce` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
