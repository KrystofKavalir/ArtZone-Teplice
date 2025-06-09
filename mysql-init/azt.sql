-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Počítač: 127.0.0.1
-- Vytvořeno: Pon 09. čen 2025, 15:25
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
-- Databáze: `azt`
--

-- --------------------------------------------------------

--
-- Struktura tabulky `akce`
--

CREATE TABLE `akce` (
  `id` int(11) NOT NULL,
  `title` varchar(128) NOT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `poradatel_id` int(11) DEFAULT NULL,
  `misto` varchar(128) DEFAULT NULL,
  `podrobnosti` text DEFAULT NULL,
  `pro_koho` varchar(256) DEFAULT NULL,
  `typ_id` int(11) DEFAULT NULL,
  `foto_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `akce`
--

INSERT INTO `akce` (`id`, `title`, `start`, `end`, `poradatel_id`, `misto`, `podrobnosti`, `pro_koho`, `typ_id`, `foto_id`) VALUES
(1, 'Nechci uz pls', '2025-03-15 20:10:00', '2025-03-16 21:00:00', 0, 'Ne', 'sdfdsf', 'Ty', NULL, NULL),
(2, 'Akce1', '2025-03-02 08:00:00', '2025-03-09 18:00:00', 0, 'Ne', 'ffdf s klsdfůsd klůjkůf lsůfsdf ', 'Já', NULL, NULL),
(3, 'Ne', '2025-03-13 00:00:00', '2025-03-14 00:00:00', 0, 'Tady', 'TESTUJU 1', 'Já', NULL, NULL),
(4, 'ANo bude bootstrap', '2025-02-21 00:00:00', '2025-02-13 00:00:00', 0, 'SPSUL', 'sdifsklfvjopvb vop mvsrfopsd msf jd', 'Já', NULL, NULL),
(5, 'Test 1', '2025-05-07 10:34:06', '2025-05-07 10:35:00', 0, NULL, 'jfjeo fjsdf josf vfajifasdijofjdsoůfidsjfjlůdsjfljků laj dsfjs joj asljsfljk ljk fjk as jfsdkl sjflkjsal fjkl jfskldj fsklfj kljf lkds fjklůasjfdklůj klj jlsd sd ajljsdflj lksůj lkůsjkflkůsdjljv lk jlk fjsdlk fjsdkl jds klůasbl a sbslf kjsdklf sfklůsalk  lůk lůskj slkůaf jsklů fjsklůf jsdklůj kalůdf jlskůf jlkůd sfjaklůsjfsadklůfjklsdjf sdklůvnalsnfsjklů nfs knlůdsfůjdas lk lk jlůsdfljvnlůsandlfk ůjsalj jskdflůsnvasvn jnoů', NULL, NULL, NULL);

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
  `data` mediumblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `role`
--

CREATE TABLE `role` (
  `id` int(11) NOT NULL,
  `nazev` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `role`
--

INSERT INTO `role` (`id`, `nazev`) VALUES
(1, 'Admin'),
(2, 'Umělec');

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
  `email` varchar(256) NOT NULL,
  `heslo` varchar(128) NOT NULL,
  `profilFoto_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT 2,
  `akce_id` int(11) DEFAULT NULL,
  `Popis` text DEFAULT NULL,
  `authorized` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `uzivatel`
--

INSERT INTO `uzivatel` (`id`, `jmeno`, `email`, `heslo`, `profilFoto_id`, `role_id`, `akce_id`, `Popis`, `authorized`) VALUES
(13, 'Kryštof Kavalír', 'krystof.kavalir@gmail.com', '$2b$10$hwx0ScPWgyLu6AgdCiwtH.MqRhMFwocqMkE0W3VKXuugnj8UspgnW', NULL, 1, NULL, NULL, 0),
(14, 'Testovaci Umelec', 'test@uzivatel.cz', '$2b$10$C5sM1uH8KMNaM90qMEJXFuYqPaE95Xx0MCyfVIHDVsVvKV5HDIo8.', NULL, 2, NULL, NULL, 0),
(15, 'random jmeno', 'random@gmail.com', '$2b$10$qoKLPOX8LokMIekpS7DeWuylGd.aB8gVc43angdsf2OolAfAwhRRS', NULL, 2, NULL, NULL, 1);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pro tabulku `typ`
--
ALTER TABLE `typ`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pro tabulku `uzivatel`
--
ALTER TABLE `uzivatel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
