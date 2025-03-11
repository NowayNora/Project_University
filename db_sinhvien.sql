-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 11, 2025 at 05:03 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_sinhvien`
--

-- --------------------------------------------------------

--
-- Table structure for table `dangkyhocphan`
--

CREATE TABLE `dangkyhocphan` (
  `ID` int(11) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `HocKy` int(11) NOT NULL,
  `NamHoc` varchar(20) NOT NULL,
  `NgayDangKy` date NOT NULL,
  `TrangThaiDangKy` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dethi`
--

CREATE TABLE `dethi` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `TenDeThi` varchar(200) NOT NULL,
  `LoaiDeThi` varchar(50) NOT NULL,
  `ThoiGianLamBai` int(11) NOT NULL,
  `HocKy` int(11) NOT NULL,
  `NamHoc` varchar(20) NOT NULL,
  `NgayTao` date NOT NULL,
  `DuongDanFile` varchar(255) NOT NULL,
  `TrangThai` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diemdanh`
--

CREATE TABLE `diemdanh` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `MaLop` varchar(20) NOT NULL,
  `NgayDiemDanh` date NOT NULL,
  `TrangThai` enum('Có mặt','Vắng có phép','Vắng không phép','Đi muộn') NOT NULL,
  `GhiChu` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `giangvien`
--

CREATE TABLE `giangvien` (
  `MaGV` varchar(10) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `GioiTinh` enum('Nam','Nữ') NOT NULL,
  `NgaySinh` date NOT NULL,
  `DiaChi` varchar(200) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `SoDienThoai` varchar(15) NOT NULL,
  `HocVi` enum('Cử nhân','Thạc sĩ','Tiến sĩ','Phó Giáo sư','Giáo sư') NOT NULL,
  `ChucDanh` varchar(100) DEFAULT NULL,
  `BoMon` varchar(100) NOT NULL,
  `Khoa` varchar(100) NOT NULL,
  `TrangThai` enum('Đang công tác','Nghỉ hưu','Nghỉ việc') NOT NULL,
  `NgayVaoLam` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ketquahoctap`
--

CREATE TABLE `ketquahoctap` (
  `ID` int(11) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `DiemSo` float DEFAULT NULL,
  `HocKy` int(11) NOT NULL,
  `NamHoc` varchar(20) NOT NULL,
  `TrangThaiHoc` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `khoaluandoan`
--

CREATE TABLE `khoaluandoan` (
  `ID` int(11) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `TenDeTai` varchar(500) NOT NULL,
  `LoaiDeTai` varchar(50) NOT NULL,
  `HocKy` int(11) NOT NULL,
  `NamHoc` varchar(20) NOT NULL,
  `NgayBatDau` date NOT NULL,
  `NgayKetThuc` date NOT NULL,
  `MoTa` varchar(1000) DEFAULT NULL,
  `DiemSo` float DEFAULT NULL,
  `TrangThai` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lichgiangday`
--

CREATE TABLE `lichgiangday` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `MaLop` varchar(20) NOT NULL,
  `NgayDay` date NOT NULL,
  `GioBatDau` time NOT NULL,
  `GioKetThuc` time NOT NULL,
  `PhongHoc` varchar(50) NOT NULL,
  `NoiDungBaiGiang` varchar(500) DEFAULT NULL,
  `TrangThai` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lichhoc`
--

CREATE TABLE `lichhoc` (
  `ID` int(11) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `NgayHoc` date NOT NULL,
  `GioBatDau` time NOT NULL,
  `GioKetThuc` time NOT NULL,
  `PhongHoc` varchar(50) NOT NULL,
  `GiangVien` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lop`
--

CREATE TABLE `lop` (
  `MaLop` varchar(20) NOT NULL,
  `TenLop` varchar(100) NOT NULL,
  `NienKhoa` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monhoc`
--

CREATE TABLE `monhoc` (
  `MaMonHoc` varchar(12) NOT NULL,
  `TenMonHoc` varchar(200) NOT NULL,
  `SoTinChi` int(11) NOT NULL CHECK (`SoTinChi` > 0),
  `ThuocNganh` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nganh`
--

CREATE TABLE `nganh` (
  `MaNganh` varchar(20) NOT NULL,
  `TenNganh` varchar(100) NOT NULL,
  `Khoa` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nghiencuukhoahoc`
--

CREATE TABLE `nghiencuukhoahoc` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `TenDeTai` varchar(500) NOT NULL,
  `CapDeTai` varchar(100) NOT NULL,
  `KinhPhi` decimal(10,2) NOT NULL,
  `NgayBatDau` date NOT NULL,
  `NgayKetThuc` date NOT NULL,
  `TrangThai` varchar(50) NOT NULL,
  `KetQuaNghiemThu` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phanconggiangday`
--

CREATE TABLE `phanconggiangday` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `MaLop` varchar(20) NOT NULL,
  `HocKy` int(11) NOT NULL,
  `NamHoc` varchar(20) NOT NULL,
  `SoTietLyThuyet` int(11) NOT NULL,
  `SoTietThucHanh` int(11) NOT NULL,
  `GhiChu` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quanlydiem`
--

CREATE TABLE `quanlydiem` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `HocKy` int(11) NOT NULL CHECK (`HocKy` between 1 and 3),
  `NamHoc` varchar(9) NOT NULL CHECK (`NamHoc` regexp '^[0-9]{4}-[0-9]{4}$'),
  `DiemChuyenCan` decimal(4,2) DEFAULT NULL CHECK (`DiemChuyenCan` between 0 and 10),
  `DiemGiuaKy` decimal(4,2) DEFAULT NULL CHECK (`DiemGiuaKy` between 0 and 10),
  `DiemThucHanh` decimal(4,2) DEFAULT NULL CHECK (`DiemThucHanh` between 0 and 10),
  `DiemCuoiKy` decimal(4,2) DEFAULT NULL CHECK (`DiemCuoiKy` between 0 and 10),
  `DiemTongKet` decimal(4,2) DEFAULT NULL CHECK (`DiemTongKet` between 0 and 10),
  `NgayNhap` date NOT NULL,
  `NgayCapNhatCuoi` date DEFAULT NULL,
  `GhiChu` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sinhvien`
--

CREATE TABLE `sinhvien` (
  `MSSV` varchar(10) NOT NULL,
  `HoTen` varchar(100) NOT NULL,
  `GioiTinh` enum('Nam','Nữ') NOT NULL,
  `NgaySinh` date NOT NULL,
  `NoiSinh` varchar(100) NOT NULL,
  `TrangThai` enum('Đang học','Bảo lưu','Tốt nghiệp') NOT NULL,
  `LopHoc` varchar(20) NOT NULL,
  `KhoaHoc` varchar(50) NOT NULL,
  `BacDaoTao` enum('Đại học','Cao đẳng','Thạc sĩ','Tiến sĩ') NOT NULL,
  `LoaiHinhDaoTao` enum('Chính quy','Liên thông','Vừa học vừa làm') NOT NULL,
  `Nganh` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tailieugiangday`
--

CREATE TABLE `tailieugiangday` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `MaMonHoc` varchar(12) NOT NULL,
  `TenTaiLieu` varchar(200) NOT NULL,
  `MoTa` varchar(500) DEFAULT NULL,
  `DuongDanFile` varchar(255) NOT NULL,
  `NgayTao` date NOT NULL,
  `NgayCapNhat` date DEFAULT NULL,
  `LoaiTaiLieu` varchar(50) NOT NULL,
  `TrangThai` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanhtoanhocphi`
--

CREATE TABLE `thanhtoanhocphi` (
  `ID` int(11) NOT NULL,
  `MSSV` varchar(10) NOT NULL,
  `SoTien` decimal(10,2) NOT NULL CHECK (`SoTien` >= 0),
  `NgayThanhToan` date NOT NULL,
  `TrangThaiThanhToan` enum('Chưa thanh toán','Đã thanh toán') NOT NULL,
  `HocKy` int(11) NOT NULL CHECK (`HocKy` between 1 and 3),
  `NamHoc` varchar(9) NOT NULL CHECK (`NamHoc` regexp '^[0-9]{4}-[0-9]{4}$'),
  `GhiChu` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanhviennghiencuu`
--

CREATE TABLE `thanhviennghiencuu` (
  `ID` int(11) NOT NULL,
  `MaNghienCuu` int(11) NOT NULL,
  `MaGV` varchar(10) DEFAULT NULL,
  `MSSV` varchar(10) DEFAULT NULL,
  `VaiTro` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thongbao`
--

CREATE TABLE `thongbao` (
  `ID` int(11) NOT NULL,
  `TieuDe` varchar(200) NOT NULL,
  `NoiDung` varchar(2000) NOT NULL,
  `NgayThongBao` date NOT NULL,
  `DoiTuong` varchar(100) NOT NULL,
  `TrangThai` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thongbaogiangvien`
--

CREATE TABLE `thongbaogiangvien` (
  `ID` int(11) NOT NULL,
  `MaGV` varchar(10) NOT NULL,
  `TieuDe` varchar(200) NOT NULL,
  `NoiDung` varchar(2000) NOT NULL,
  `NgayThongBao` date NOT NULL,
  `DoiTuong` varchar(255) NOT NULL,
  `TrangThai` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dangkyhocphan`
--
ALTER TABLE `dangkyhocphan`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MSSV` (`MSSV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`);

--
-- Indexes for table `dethi`
--
ALTER TABLE `dethi`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`);

--
-- Indexes for table `diemdanh`
--
ALTER TABLE `diemdanh`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `MSSV` (`MSSV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`),
  ADD KEY `MaLop` (`MaLop`);

--
-- Indexes for table `giangvien`
--
ALTER TABLE `giangvien`
  ADD PRIMARY KEY (`MaGV`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD UNIQUE KEY `SoDienThoai` (`SoDienThoai`),
  ADD KEY `idx_GiangVien_Email` (`Email`),
  ADD KEY `idx_GiangVien_SoDienThoai` (`SoDienThoai`);

--
-- Indexes for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MSSV` (`MSSV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`);

--
-- Indexes for table `khoaluandoan`
--
ALTER TABLE `khoaluandoan`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MSSV` (`MSSV`),
  ADD KEY `MaGV` (`MaGV`);

--
-- Indexes for table `lichgiangday`
--
ALTER TABLE `lichgiangday`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`),
  ADD KEY `MaLop` (`MaLop`);

--
-- Indexes for table `lichhoc`
--
ALTER TABLE `lichhoc`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaMonHoc` (`MaMonHoc`),
  ADD KEY `MSSV` (`MSSV`);

--
-- Indexes for table `lop`
--
ALTER TABLE `lop`
  ADD PRIMARY KEY (`MaLop`);

--
-- Indexes for table `monhoc`
--
ALTER TABLE `monhoc`
  ADD PRIMARY KEY (`MaMonHoc`),
  ADD KEY `ThuocNganh` (`ThuocNganh`);

--
-- Indexes for table `nganh`
--
ALTER TABLE `nganh`
  ADD PRIMARY KEY (`MaNganh`),
  ADD UNIQUE KEY `TenNganh` (`TenNganh`);

--
-- Indexes for table `nghiencuukhoahoc`
--
ALTER TABLE `nghiencuukhoahoc`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`);

--
-- Indexes for table `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`),
  ADD KEY `MaLop` (`MaLop`);

--
-- Indexes for table `quanlydiem`
--
ALTER TABLE `quanlydiem`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `idx_Diem_MSSV` (`MSSV`),
  ADD KEY `idx_Diem_MaMonHoc` (`MaMonHoc`);

--
-- Indexes for table `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD PRIMARY KEY (`MSSV`),
  ADD KEY `LopHoc` (`LopHoc`),
  ADD KEY `Nganh` (`Nganh`),
  ADD KEY `idx_SinhVien_MSSV` (`MSSV`);

--
-- Indexes for table `tailieugiangday`
--
ALTER TABLE `tailieugiangday`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `MaMonHoc` (`MaMonHoc`);

--
-- Indexes for table `thanhtoanhocphi`
--
ALTER TABLE `thanhtoanhocphi`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idx_ThanhToan_MSSV` (`MSSV`);

--
-- Indexes for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaNghienCuu` (`MaNghienCuu`),
  ADD KEY `MaGV` (`MaGV`),
  ADD KEY `MSSV` (`MSSV`);

--
-- Indexes for table `thongbao`
--
ALTER TABLE `thongbao`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `thongbaogiangvien`
--
ALTER TABLE `thongbaogiangvien`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `MaGV` (`MaGV`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dangkyhocphan`
--
ALTER TABLE `dangkyhocphan`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dethi`
--
ALTER TABLE `dethi`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `diemdanh`
--
ALTER TABLE `diemdanh`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `khoaluandoan`
--
ALTER TABLE `khoaluandoan`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lichgiangday`
--
ALTER TABLE `lichgiangday`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lichhoc`
--
ALTER TABLE `lichhoc`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nghiencuukhoahoc`
--
ALTER TABLE `nghiencuukhoahoc`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quanlydiem`
--
ALTER TABLE `quanlydiem`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tailieugiangday`
--
ALTER TABLE `tailieugiangday`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thanhtoanhocphi`
--
ALTER TABLE `thanhtoanhocphi`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thongbao`
--
ALTER TABLE `thongbao`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thongbaogiangvien`
--
ALTER TABLE `thongbaogiangvien`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dangkyhocphan`
--
ALTER TABLE `dangkyhocphan`
  ADD CONSTRAINT `dangkyhocphan_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`),
  ADD CONSTRAINT `dangkyhocphan_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`);

--
-- Constraints for table `dethi`
--
ALTER TABLE `dethi`
  ADD CONSTRAINT `dethi_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`),
  ADD CONSTRAINT `dethi_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`);

--
-- Constraints for table `diemdanh`
--
ALTER TABLE `diemdanh`
  ADD CONSTRAINT `diemdanh_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`) ON DELETE CASCADE,
  ADD CONSTRAINT `diemdanh_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE,
  ADD CONSTRAINT `diemdanh_ibfk_3` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`) ON DELETE CASCADE,
  ADD CONSTRAINT `diemdanh_ibfk_4` FOREIGN KEY (`MaLop`) REFERENCES `lop` (`MaLop`) ON DELETE CASCADE;

--
-- Constraints for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  ADD CONSTRAINT `ketquahoctap_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`),
  ADD CONSTRAINT `ketquahoctap_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`);

--
-- Constraints for table `khoaluandoan`
--
ALTER TABLE `khoaluandoan`
  ADD CONSTRAINT `khoaluandoan_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`),
  ADD CONSTRAINT `khoaluandoan_ibfk_2` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`);

--
-- Constraints for table `lichgiangday`
--
ALTER TABLE `lichgiangday`
  ADD CONSTRAINT `lichgiangday_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`),
  ADD CONSTRAINT `lichgiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  ADD CONSTRAINT `lichgiangday_ibfk_3` FOREIGN KEY (`MaLop`) REFERENCES `lop` (`MaLop`);

--
-- Constraints for table `lichhoc`
--
ALTER TABLE `lichhoc`
  ADD CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  ADD CONSTRAINT `lichhoc_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`);

--
-- Constraints for table `monhoc`
--
ALTER TABLE `monhoc`
  ADD CONSTRAINT `monhoc_ibfk_1` FOREIGN KEY (`ThuocNganh`) REFERENCES `nganh` (`TenNganh`) ON DELETE CASCADE;

--
-- Constraints for table `nghiencuukhoahoc`
--
ALTER TABLE `nghiencuukhoahoc`
  ADD CONSTRAINT `nghiencuukhoahoc_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`);

--
-- Constraints for table `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  ADD CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`),
  ADD CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`),
  ADD CONSTRAINT `phanconggiangday_ibfk_3` FOREIGN KEY (`MaLop`) REFERENCES `lop` (`MaLop`);

--
-- Constraints for table `quanlydiem`
--
ALTER TABLE `quanlydiem`
  ADD CONSTRAINT `quanlydiem_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`) ON DELETE CASCADE,
  ADD CONSTRAINT `quanlydiem_ibfk_2` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE,
  ADD CONSTRAINT `quanlydiem_ibfk_3` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`) ON DELETE CASCADE;

--
-- Constraints for table `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`LopHoc`) REFERENCES `lop` (`MaLop`) ON DELETE CASCADE,
  ADD CONSTRAINT `sinhvien_ibfk_2` FOREIGN KEY (`Nganh`) REFERENCES `nganh` (`MaNganh`) ON DELETE CASCADE;

--
-- Constraints for table `tailieugiangday`
--
ALTER TABLE `tailieugiangday`
  ADD CONSTRAINT `tailieugiangday_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`),
  ADD CONSTRAINT `tailieugiangday_ibfk_2` FOREIGN KEY (`MaMonHoc`) REFERENCES `monhoc` (`MaMonHoc`);

--
-- Constraints for table `thanhtoanhocphi`
--
ALTER TABLE `thanhtoanhocphi`
  ADD CONSTRAINT `thanhtoanhocphi_ibfk_1` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`) ON DELETE CASCADE;

--
-- Constraints for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_1` FOREIGN KEY (`MaNghienCuu`) REFERENCES `nghiencuukhoahoc` (`ID`),
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_2` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`),
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_3` FOREIGN KEY (`MSSV`) REFERENCES `sinhvien` (`MSSV`);

--
-- Constraints for table `thongbaogiangvien`
--
ALTER TABLE `thongbaogiangvien`
  ADD CONSTRAINT `thongbaogiangvien_ibfk_1` FOREIGN KEY (`MaGV`) REFERENCES `giangvien` (`MaGV`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
